/* ==========================================================================
   Formulário de contacto

   O site é estático (GitHub Pages) e não tem servidor. Por isso o formulário
   envia os dados para um serviço externo (Formspree), que os reencaminha por
   email. O endereço desse serviço está no atributo data-endpoint do <form>.

   Este ficheiro faz quatro coisas:
   1. Pré-seleciona o serviço vindo da ligação (contacto.html?servico=automacao)
   2. Valida os campos e mostra o erro junto de cada um
   3. Envia com fetch e mostra a confirmação sem sair da página
   4. Se o serviço ainda não estiver configurado, avisa e propõe o WhatsApp
   ========================================================================== */
(function () {
    'use strict';

    var form = document.getElementById('contactForm');
    if (!form) return;

    var MSG = {
        pt: {
            required: 'Preencha este campo.',
            email: 'Indique um email válido.',
            service: 'Escolha pelo menos uma área.',
            consent: 'É necessário aceitar a Política de Privacidade.',
            sending: 'A enviar...',
            fail: 'Não foi possível enviar. Tente novamente ou fale connosco por WhatsApp.',
            notReady: 'O formulário ainda não está ligado ao serviço de envio. Fale connosco por WhatsApp.'
        },
        en: {
            required: 'Please fill in this field.',
            email: 'Enter a valid email.',
            service: 'Choose at least one area.',
            consent: 'You need to accept the Privacy Policy.',
            sending: 'Sending...',
            fail: 'We could not send it. Please try again or talk to us on WhatsApp.',
            notReady: 'The form is not yet connected to the sending service. Please talk to us on WhatsApp.'
        }
    };

    function text(key) {
        var lang = document.documentElement.lang.indexOf('en') === 0 ? 'en' : 'pt';
        return MSG[lang][key];
    }

    /* 1. Serviço vindo da ligação ------------------------------------------ */
    var preset = new URLSearchParams(window.location.search).get('servico');
    if (preset) {
        var box = form.querySelector('input[data-key="' + preset + '"]');
        if (box) box.checked = true;
    }

    /* 2. Validação --------------------------------------------------------- */
    function setError(id, message) {
        var holder = document.getElementById(id + '-error');
        var field = document.getElementById(id);
        if (holder) holder.textContent = message || '';
        if (field) {
            if (message) {
                field.setAttribute('aria-invalid', 'true');
                field.setAttribute('aria-describedby', id + '-error');
            } else {
                field.removeAttribute('aria-invalid');
                field.removeAttribute('aria-describedby');
            }
        }
    }

    function validate() {
        var firstBad = null;

        function fail(id, key) {
            setError(id, text(key));
            if (!firstBad) firstBad = document.getElementById(id);
        }

        ['nome', 'telefone', 'empresa'].forEach(function (id) {
            var field = document.getElementById(id);
            setError(id, '');
            if (!field.value.trim()) fail(id, 'required');
        });

        var email = document.getElementById('email');
        setError('email', '');
        if (!email.value.trim()) fail('email', 'required');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) fail('email', 'email');

        /* Pelo menos uma área de serviço marcada */
        var anyService = form.querySelector('input[name="servico"]:checked');
        var serviceError = document.getElementById('servico-error');
        serviceError.textContent = anyService ? '' : text('service');
        if (!anyService && !firstBad) firstBad = form.querySelector('input[name="servico"]');

        var consent = document.getElementById('consentimento');
        var consentError = document.getElementById('consentimento-error');
        consentError.textContent = consent.checked ? '' : text('consent');
        if (!consent.checked && !firstBad) firstBad = consent;

        if (firstBad) firstBad.focus();
        return !firstBad;
    }

    /* 3. Envio ------------------------------------------------------------- */
    var status = document.getElementById('formStatus');
    var button = form.querySelector('button[type="submit"]');

    function showStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle('err', !!isError);
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        showStatus('', false);
        if (!validate()) return;

        var endpoint = form.getAttribute('data-endpoint') || '';

        /* 4. Ainda sem serviço configurado */
        if (!endpoint || endpoint.indexOf('SEU_ID') !== -1) {
            showStatus(text('notReady'), true);
            return;
        }

        button.disabled = true;
        showStatus(text('sending'), false);

        fetch(endpoint, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
        }).then(function (response) {
            if (!response.ok) throw new Error('http ' + response.status);
            form.hidden = true;
            document.getElementById('formDone').hidden = false;
            document.getElementById('formDone').focus();
        }).catch(function () {
            button.disabled = false;
            showStatus(text('fail'), true);
        });
    });
})();
