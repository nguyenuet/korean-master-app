# 🇰🇷 Korean Master – Ứng dụng luyện tiếng Hàn cho người Việt

Ứng dụng web học tiếng Hàn tổng hợp từ 3 bộ giáo trình chuẩn: **Tiếng Hàn Tổng Hợp dành cho người Việt Nam**, **Giáo trình tiếng Hàn Sejong**, và **Giáo trình tiếng Hàn ĐHQG Seoul (SNU)**.

## ✨ Tính năng chính
- **Lộ trình 4 cấp độ** (Sơ cấp 1–2, Trung cấp 3–4), mỗi bài học gồm 4 tab:
  1. **Từ vựng (Vocabulary):** Hangul, nghĩa tiếng Việt, phiên âm + lưu ý biến âm, câu ví dụ, chế độ **Flashcard** lật thẻ.
  2. **Ngữ pháp (Grammar):** Giải thích tiếng Việt dễ hiểu, công thức chia theo Patchim / nguyên âm `ㅏ/ㅗ`, lỗi thường gặp và ví dụ thực tế.
  3. **Hội thoại mẫu (Dialogue):** Hội thoại Nam – Nữ, nghe từng câu hoặc nghe toàn bộ hội thoại, bật/tắt dịch tiếng Việt.
  4. **Luyện tập (Practice – Nghe & Đọc):** Điền từ, nối cặp, đọc hiểu đoạn văn, nghe chọn đáp án, nghe sắp xếp câu – chấm điểm và giải thích tức thì.
- **Hệ thống âm thanh thời gian thực (Không lưu file `.mp3` tĩnh):**
  - Cloudflare Pages Function `/api/tts` kết nối trực tiếp Microsoft Edge Neural TTS (`ko-KR-SunHiNeural` nữ & `ko-KR-InJoonNeural` nam) + fallback Google Translate TTS và `window.speechSynthesis`.
  - Hỗ trợ chuyển tốc độ **1.0x** và **0.75x (nghe chậm)** kèm hiệu ứng sóng âm.
- **Dashboard, Streak 🔥 & Lưu trữ kép (LocalStorage + Cloudflare D1):**
  - Lưu tức thì 0ms tại `localStorage`, đồng bộ đám mây qua `/api/progress` bằng **Tên học viên + Mã PIN 4 số**.

## 🚀 Chạy ở máy cá nhân
```bash
npm install
npm run build
npx wrangler pages dev dist
```
