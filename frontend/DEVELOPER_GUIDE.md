# دليل مطور الواجهة — Frontend Developer Guide

هذا الملف يشرح بنية وتصرّف واجهة المشروع وكيفية تشغيلها وتطويرها لأي شخص سيكمل العمل بعدك.

**مقدمة**
- المشروع يستخدم React + Vite.
- المجلد الرئيسي للفرونت: `frontend`.
- نقطة الدخول: `frontend/src/main.jsx`، المكوّن الرئيسي في `frontend/src/App.jsx`.

**المكدس والتبعيات**
- React 19
- Vite
- Axios (للاتصال بالـ API)
- TailwindCSS
- مكتبات أخرى مدرجة في `frontend/package.json`

**المتطلبات المحلية**
- Node.js (14+ يفضّل 18+)
- npm أو yarn

**تشغيل محلي**
1. افتح تيرمنال في `frontend`.
2. ثبّت الحزم:

```bash
cd frontend
npm install
```

3. شغّل السيرفر التطويري:

```bash
npm run dev
```

4. افتح المتصفح على العنوان المعروض (عادةً `http://localhost:5173`).

**ملف الإعدادات / متغيرات البيئة**
- لا يوجد `.env` حقيقي هنا، لكن المهم ضبط رابط الـ API في الكود أو إنشاء ملف `.env` محلي يحتوي على:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

- في الكود استخدم `import.meta.env.VITE_API_BASE_URL` كمصدر لقاعدة الـ API.

**بنية المجلدات (مختصر)**
- `src/`
  - `api/` — ملفات الاتصال بالـ API (axios instances, endpoints)
  - `components/` — مكوّنات قابلة لإعادة الاستخدام
  - `pages/` — صفحات التطبيق (Login, Register, Dashboard, Jobs, Profile, UploadCV)
  - `context/` — React contexts (مثلاً AuthContext)
  - `hooks/` — custom hooks
  - `services/` — خدمات مشتركة (wrappers حول API أو helpers)
  - `assets/` — صور / أيقونات

**المصادقة (Auth flow)**
- عند التسجيل/تسجيل الدخول السيرفر يرجع token (sanctum personal access token).
- يتم حفظ الـ token في `localStorage` أو داخل `AuthContext` حسب الكود الحالي.
- الـ axios instance يجب أن يضيف header `Authorization: Bearer <token>` تلقائياً عند وجوده.
- نقاط يجب الانتباه لها:
  - حماية الصفحات المحمية بفحص وجود المستخدم/الـ token.
  - معالجة انتهاء صلاحية التوكن (ظهور خطأ 401 → إعادة التوجيه لصفحة الدخول).

**رفع السيرة الذاتية (Upload CV)**
- Endpoint: `POST /api/upload-cv` (multipart/form-data field name: `cv`).
- تأكد إرسال header `Accept: application/json` و `Authorization` (محمي).
- الاستجابة الآن تُرجع فقط مهارات آخر ملف مرفوع (`matched_skills` و `unmatched_skills`).
- مثال رفع باستخدام `FormData`:

```js
const fd = new FormData();
fd.append('cv', fileInput.files[0]);
await axios.post(`${BASE}/api/upload-cv`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
```

**اتصالات الـ API المهمة**
- `POST /api/register` — تسجيل
- `POST /api/login` — تسجيل دخول
- `GET /api/jobs` — قائمة الوظائف
- `GET /api/jobs/:id` — عرض وظيفة
- `POST /api/upload-cv` — رفع وتحليل السيرة
- `GET /api/user/skills` — جلب مهارات المستخدم

**كيفية إضافة صفحة أو مكوّن جديد**
1. أنشئ ملف داخل `src/pages/` أو `src/components/` حسب نوعه.
2. إذا صفحة، حدّث `src/main.jsx` أو ملف الروترات (مثلاً `src/App.jsx`) لإضافة المسار.
3. أعد استخدام مكوّنات صغيرة بدلاً من ملفات كبيرة.
4. التزم بـ Tailwind utility classes إن تم استخدامها.

**نمط الترميز وقواعد صغيرة**
- سمّ المتغيرات والمكوّنات بشكل وصفي.
- استخدم Hooks للاحتفاظ بالحالة، ولا تكتب منطق كبير داخل JSX.
- اجعل استدعاءات الـ API في `api/` أو `services/` وليس مباشرة داخل المكوّن العرضي.

**الاختبارات**
- لا يوجد حالياً اختبارات frontend في المشروع. لإضافة اختبارات استخدم `Vitest` أو `Jest + React Testing Library`.

**أوامر مفيدة**
- تشغيل dev: `npm run dev`
- بناء للإنتاج: `npm run build`
- معاينة البناء: `npm run preview`
- eslint: `npm run lint`

**نشر/نصائح الإنتاج**
- استخدم `VITE_API_BASE_URL` ليناسب بيئة الإنتاج.
- احرص على إعداد CORS في السيرفر الخلفي لاسم الدومين.
- استخدم HTTPS و environment variables آمنة في CI/CD.

**مشاكل شائعة وحلول**
- 401 عند استدعاء محمي: تأكد من إرسال `Authorization` ووجود التوكن.
- مشكلات CORS: تحقق من `SANCTUM_STATEFUL_DOMAINS` و`cors.php` في backend.
- رفع ملفات كبيرة ينهار: تأكد من قيود حجم الرفع في nginx/php.ini وحقق حجم ملف مُسموح.

**كيفية المتابعة بعدي (جهة فعل للمطور التالي)**
1. شغّل الbackend وAI engine محلياً كما هو موصوف في root README.
2. شغّل الfrontend، سجّل دخول مستخدم تجريبي، وجرّب رفع CV.
3. اطلع على اللوجات إن واجهت خطأ: backend logs في `backend-api/storage/logs/laravel.log`.
4. راجع قواعد البيانات (`skills`/`user_skills`) بعد رفع CV للتأكد من التغييرات.

**نقطة أخيرة**
- إن احتجت أوضّح أجزاء من الـ frontend (مكوّن معيّن أو flow معين)، قلّي أي صفحة أو مكوّن أشرحه بالتفصيل وسأضيف أمثلة كود مباشرة في الدليل.

---

ملف الإنشاء: `frontend/DEVELOPER_GUIDE.md`