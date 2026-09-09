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
    // 1. تحميل الشعارات مباشرة من البيانات المدمجة (Data URIs)
    // ========================================================
    const logoMap = {
        'logoRight1': window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.monufia,
        'logoRight2': window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.center,
        'logoLeft1':  window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.ministry,
        'logoLeft2':  window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.monufia
    };

    const headerLogos = document.querySelectorAll('.header-logo-img');
    headerLogos.forEach(img => {
        img.addEventListener('error', () => {
            // لو فشل تحميل الشعار، نجرب مصدراً آخر أو نخفيه
            if (logoMap[img.id]) {
                const backup = logoMap[img.id];
                img.src = backup;
            } else {
                img.style.display = 'none';
            }
        });
    });

    // تعيين جميع الشعارات من البيانات المدمجة مباشرة
    headerLogos.forEach(img => {
        if (logoMap[img.id]) {
            img.src = logoMap[img.id];
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

            try {
                if (!window.html2canvas) {
                    throw new Error('مكتبة التصدير لم تُحمّل. تأكد من الاتصال بالإنترنت ثم أعد تحميل الصفحة.');
                }

                // نقل قيم الحقول لتظهر في الصورة
                ambassadorCard.querySelectorAll('input[type="text"], input[type="tel"]').forEach(i => {
                    i.setAttribute('value', i.value);
                });
                ambassadorCard.querySelectorAll('textarea').forEach(t => {
                    t.textContent = t.value;
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
            }
        });
    }

});