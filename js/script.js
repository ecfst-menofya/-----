/**
 * بطاقة سفير المركز الاستكشافي بالمنوفية
 * الشعارات محمّلة بصيغة Data URI مدمجة (من logos-data.js)
 * حتى تظهر دائماً وتنجح في التصدير تحت file:/// بدون مشاكل
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 0. ضبط أبعاد البطاقة لتلائم الشاشة تلقائياً
    // ========================================================
    const cardWrapper = document.getElementById('ambassadorCard');

    function fitCardToScreen() {
        if (!cardWrapper) return;
        const BAR_WRAPPER = document.querySelector('.action-bar');
        const barHeight = BAR_WRAPPER ? BAR_WRAPPER.offsetHeight + 18 : 70;
        const availableHeight = window.innerHeight - barHeight - 30;
        const availableWidth = window.innerWidth - 20;
        const cardWidth = cardWrapper.offsetWidth;
        const cardHeight = cardWrapper.offsetHeight;
        const scaleWidth = availableWidth / cardWidth;
        const scaleHeight = availableHeight / cardHeight;
        const isMobile = window.innerWidth <= 680;
        let scale;
        if (isMobile) {
            // الموبايل: نناسب عرض الشاشة فقط (تكبير أكبر للحقول) مع تمرير عمودي
            scale = Math.min(scaleWidth, 1);
        } else {
            // الكمبيوتر: نناسب أصغر بُعد لتظهر البطاقة كاملة بدون قص
            scale = Math.min(scaleWidth, scaleHeight, 1);
        }
        cardWrapper.style.transform = 'scale(' + scale + ')';
        cardWrapper.style.transformOrigin = 'top center';
        cardWrapper.style.marginBottom = ((1 - scale) * cardHeight) + 'px';
    }

    window.addEventListener('resize', fitCardToScreen);
    fitCardToScreen();

    // إعادة ضبط المقاس بعد جاهزية الخطوط لضمان أبعاد دقيقة
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(fitCardToScreen, 50));
    }
    window.addEventListener('load', () => setTimeout(fitCardToScreen, 100));

    // ========================================================
    // 1. توسيع تلقائي لحقول النص متعددة الأسطر
    // ========================================================
    function autoGrow(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    document.querySelectorAll('textarea.table-cell-input, textarea.ruled-textarea, textarea.row-input').forEach(ta => {
        ta.addEventListener('input', () => autoGrow(ta));
    });

    // منع الكتابة فوق 3 أسطر في خانات الدورات والإنجازات
    var lineLimitToast = null;
    function showLineLimitToast() {
        if (lineLimitToast) { clearTimeout(lineLimitToast._t); lineLimitToast.remove(); }
        lineLimitToast = document.createElement('div');
        lineLimitToast.className = 'line-limit-toast';
        lineLimitToast.textContent = 'غير ممكن — الحد الأقصى 3 أسطر فقط';
        document.body.appendChild(lineLimitToast);
        lineLimitToast._t = setTimeout(() => {
            if (lineLimitToast) lineLimitToast.remove();
            lineLimitToast = null;
        }, 2000);
    }

    document.querySelectorAll('textarea.ruled-textarea').forEach(ta => {
        ta.dataset.lastGood = ta.value;
        ta.addEventListener('input', () => {
            if (ta.scrollHeight > 90) {
                ta.value = ta.dataset.lastGood;
                showLineLimitToast();
            } else {
                ta.dataset.lastGood = ta.value;
            }
        });
    });

    // ========================================================
    // 1. تحميل الشعارات من البيانات المدمجة (Data URIs)
    // ========================================================
    const logoIdMap = ['logo4', 'logo3', 'logo2', 'logo1'];
    const logoContainers = document.querySelectorAll('.logos-side .logo-container');
    logoContainers.forEach((container, i) => {
        const img = container.querySelector('img');
        const key = logoIdMap[i];
        if (img && window.LOGOS_DATA && window.LOGOS_DATA[key]) {
            img.src = window.LOGOS_DATA[key];
        }
    });

    // ========================================================
    // 2. إدارة الصورة الشخصية
    // ========================================================
    const photoBox = document.getElementById('studentPhotoBox');
    const photoInput = document.getElementById('img');
    const photoImg = document.getElementById('studentPhotoImg');
    const photoPlaceholder = document.getElementById('photoPlaceholder');

    if (photoBox && photoInput) {
        photoBox.addEventListener('click', (e) => {
            if (e.target !== photoInput) photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photoImg.src = event.target.result;
                    photoImg.classList.remove('hidden');
                    photoPlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ========================================================
    // 3. مؤشر التحميل
    // ========================================================
    function showLoading() {
        let overlay = document.getElementById('loadingOverlay');
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">جاري تصدير الصورة...</div>
            <div class="loading-subtext">يرجى الانتظار قليلاً</div>
        `;
        document.body.appendChild(overlay);
    }

    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    }

    // ========================================================
    // 4. تصدير الصورة بأعلى جودة
    // ========================================================
    const exportBtn = document.getElementById('exportBtn');
    const ambassadorCard = document.getElementById('ambassadorCard');

    if (exportBtn && ambassadorCard) {
        exportBtn.addEventListener('click', async () => {
            exportBtn.disabled = true;
            showLoading();

            // حفظ المقياس الحالي وإرجاع البطاقة لأبعادها الكاملة للتصدير
            const savedTransform = cardWrapper.style.transform;
            const savedMarginBottom = cardWrapper.style.marginBottom;
            cardWrapper.style.transform = '';
            cardWrapper.style.marginBottom = '';

            // قائمة النسخ الاحتياطية لحقول النص
            const textareaBackups = [];

            try {
                if (!window.html2canvas) {
                    throw new Error('مكتبة التصدير لم تُحمّل. تأكد من الاتصال بالإنترنت ثم أعد تحميل الصفحة.');
                }

                // استبدال العناصر بأخرى تعرض النص كما هو أثناء التصدير
                function makeExportDiv(ta) {
                    const div = document.createElement('div');
                    if (ta.classList.contains('table-cell-input') || ta.classList.contains('row-input')) {
                        div.className = 'export-cell';
                        if (ta.classList.contains('row-input')) div.classList.add('row-export');
                        if (ta.getAttribute('dir') === 'ltr') div.dir = 'ltr';
                        div.textContent = ta.value;
                    } else {
                        div.className = 'export-ruled';
                        div.setAttribute('dir', 'auto');
                        const safeText = ta.value
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n/g, '<br>');
                        div.innerHTML = safeText;
                    }
                    return div;
                }

                // نقل قيم حقول الإدخال إلى السمة value لتظهر في الصورة
                ambassadorCard.querySelectorAll('input[type="text"], input[type="tel"]').forEach(i => {
                    i.setAttribute('value', i.value);
                });

                // حفظ الـ textareas واستبدالها في الصفحة الحقيقية قبل التصوير
                ambassadorCard.querySelectorAll('textarea').forEach(ta => {
                    const parent = ta.parentNode;
                    const div = makeExportDiv(ta);
                    textareaBackups.push({ textarea: ta, parent: parent, div: div });
                    parent.replaceChild(div, ta);
                });

                // انتظار اكتمال تحميل الخطوط
                if (document.fonts && document.fonts.ready) {
                    try { await document.fonts.ready; } catch (e) {}
                }

                // تصدير بأعلى جودة
                const canvas = await window.html2canvas(ambassadorCard, {
                    scale: 3,               // دقة فائقة لطباعة A4
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true,
                    onclone: (clonedDoc) => {
                        // إزالة عناصر التحكم حتى لا تظهر في الصورة
                        const controls = clonedDoc.querySelectorAll('.no-export');
                        controls.forEach(n => n.parentNode && n.parentNode.removeChild(n));
                        // تفعيل تخطيط A4 الكامل في النسخة المُصدَّرة
                        const clonedHtml = clonedDoc.querySelector('html');
                        if (clonedHtml) clonedHtml.classList.add('exporting');
                    }
                });

                if (!canvas || canvas.width === 0) {
                    throw new Error('فشل إنشاء الصورة. حاول مرة أخرى.');
                }

                let imageUri;
                try {
                    imageUri = canvas.toDataURL('image/png');
                } catch (e) {
                    throw new Error('تعذر تحويل الصورة إلى PNG (مشكلة أمان بالمتصفح).');
                }

                const link = document.createElement('a');
                link.download = 'بطاقة_سفير_المركز_الاستكشافي_A4.png';
                link.href = imageUri;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => document.body.removeChild(link), 100);

            } catch (error) {
                console.error('خطأ التصدير:', error);
                alert('حدث خطأ أثناء التصدير: ' + error.message);
            } finally {
                // إعادة الـ textareas إلى أماكنها
                textareaBackups.forEach(b => {
                    if (b.div.parentNode) b.parent.replaceChild(b.textarea, b.div);
                });
                // إعادة المقياس كما كان
                cardWrapper.style.transform = savedTransform;
                cardWrapper.style.marginBottom = savedMarginBottom;
                hideLoading();
                exportBtn.disabled = false;
            }
        });
    }

    // ========================================================
    // 5. إعادة تعيين الاستمارة
    // ========================================================
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من رغبتك في تفريغ بيانات الاستمارة؟')) {
                const form = document.getElementById('ambassadorForm');
                if (form) form.reset();
                photoImg.src = '';
                photoImg.classList.add('hidden');
                photoPlaceholder.classList.remove('hidden');
                // إعادة ضبط ارتفاع حقول النص
                document.querySelectorAll('textarea.table-cell-input, textarea.row-input').forEach(ta => {
                    ta.style.height = 'auto';
                });
            }
        });
    }

});