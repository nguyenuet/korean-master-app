import type { Level, Unit, UnitOutline } from '../types';
import { unit1 } from './units/unit1';
import { unit2 } from './units/unit2';
import { unit3 } from './units/unit3';
import { unit4 } from './units/unit4';
import { unit5 } from './units/unit5';

/** Fully authored units (content synthesized from Tiếng Hàn Tổng Hợp, Sejong & SNU) */
export const UNITS: Record<string, Unit> = Object.fromEntries(
  [unit1, unit2, unit3, unit4, unit5].map((u) => [u.id, u]),
);

const o = (
  level: number,
  number: number,
  emoji: string,
  title: string,
  titleKo: string,
  description: string,
): UnitOutline => ({ id: `s${level}-u${number}`, level, number, emoji, title, titleKo, description });

const fromUnit = (u: Unit): UnitOutline => ({
  id: u.id, level: u.level, number: u.number, emoji: u.emoji, title: u.title, titleKo: u.titleKo, description: u.description,
});

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Sơ cấp 1',
    nameKo: '초급 1',
    description: 'Làm quen chữ Hangul, câu giao tiếp cơ bản, đuôi câu lịch sự 입니다 / 아요·어요.',
    color: 'from-sky-500 to-blue-600',
    units: [
      fromUnit(unit1),
      fromUnit(unit2),
      fromUnit(unit3),
      fromUnit(unit4),
      fromUnit(unit5),
      o(1, 6, '🕐', 'Thời gian & Lịch hẹn', '시간과 약속', 'Đọc giờ, thứ trong tuần, hẹn gặp: -(으)ㄹ까요?, -에 (thời gian).'),
      o(1, 7, '👨‍👩‍👧', 'Gia đình', '가족', 'Thành viên gia đình, kính ngữ -(으)시-, 께서.'),
      o(1, 8, '🌦️', 'Thời tiết & Mùa', '날씨와 계절', 'Bốn mùa, thời tiết, -고, -지만.'),
      o(1, 9, '📞', 'Gọi điện thoại', '전화', 'Số điện thoại, -(으)러 가다, -고 싶다.'),
      o(1, 10, '🎂', 'Sinh nhật', '생일', 'Ngày tháng, quá khứ -았/었어요, quà tặng.'),
      o(1, 11, '🎨', 'Sở thích', '취미', 'Sở thích, -는 것을 좋아하다, -(으)ㄹ 수 있다.'),
      o(1, 12, '🚇', 'Giao thông', '교통', 'Phương tiện, -(으)로, -에서 -까지.'),
    ],
  },
  {
    id: 2,
    name: 'Sơ cấp 2',
    nameKo: '초급 2',
    description: 'Mở rộng giao tiếp đời sống: mô tả, so sánh, kinh nghiệm, kế hoạch.',
    color: 'from-emerald-500 to-teal-600',
    units: [
      o(2, 1, '🍜', 'Nhà hàng & Gọi món', '식당', '-아/어 주세요, -(으)ㄹ게요, mùi vị món ăn.'),
      o(2, 2, '🏥', 'Bệnh viện & Sức khỏe', '병원', 'Triệu chứng, -아/어서 (lý do), -지 마세요.'),
      o(2, 3, '✈️', 'Du lịch', '여행', '-아/어 봤어요 (kinh nghiệm), -(으)려고 하다.'),
      o(2, 4, '🏠', 'Thuê nhà', '집 구하기', '-(으)ㄴ/는 (định ngữ), so sánh 보다 더.'),
      o(2, 5, '👕', 'Quần áo & Ngoại hình', '옷과 외모', '-고 있다 (mặc), -아/어 보이다.'),
      o(2, 6, '🏦', 'Ngân hàng & Bưu điện', '은행과 우체국', '-(으)려면, -아/어야 하다.'),
      o(2, 7, '🎉', 'Lễ hội Hàn Quốc', '명절', 'Seollal, Chuseok, -(으)ㄹ 때.'),
      o(2, 8, '💬', 'Cảm xúc', '감정', '-아/어하다, -(으)ㄴ/는데요.'),
    ],
  },
  {
    id: 3,
    name: 'Trung cấp 3',
    nameKo: '중급 3',
    description: 'Diễn đạt ý kiến, kể chuyện, văn viết -다 thể thông báo.',
    color: 'from-violet-500 to-purple-600',
    units: [
      o(3, 1, '💼', 'Công việc & Phỏng vấn', '직장과 면접', '-기 위해서, -(으)ㄴ 적이 있다.'),
      o(3, 2, '📰', 'Tin tức & Xã hội', '뉴스와 사회', 'Câu gián tiếp -다고 하다.'),
      o(3, 3, '🌱', 'Môi trường', '환경', '-게 되다, -(으)ㄹ수록.'),
      o(3, 4, '🎬', 'Văn hóa đại chúng', '대중문화', '-던, -았/었던.'),
      o(3, 5, '🤝', 'Quan hệ con người', '인간관계', '-는 바람에, -(으)ㄴ/는 편이다.'),
      o(3, 6, '📱', 'Công nghệ', '과학 기술', '-(으)ㄴ/는 덕분에, -에 따라.'),
    ],
  },
  {
    id: 4,
    name: 'Trung cấp 4',
    nameKo: '중급 4',
    description: 'Tiếng Hàn học thuật & TOPIK II: lập luận, tục ngữ, văn bản chuyên đề.',
    color: 'from-rose-500 to-pink-600',
    units: [
      o(4, 1, '🎓', 'Giáo dục', '교육', '-(으)ㅁ, -기 마련이다.'),
      o(4, 2, '💰', 'Kinh tế', '경제', '-는 반면에, -(으)ㄹ 뿐만 아니라.'),
      o(4, 3, '🏛️', 'Lịch sử & Truyền thống', '역사와 전통', '-았/었더니, -(으)ㄴ 채로.'),
      o(4, 4, '🧠', 'Tâm lý & Sức khỏe tinh thần', '심리', '-기 십상이다, -다 보면.'),
      o(4, 5, '📜', 'Tục ngữ & Thành ngữ', '속담과 관용어', 'Tục ngữ thông dụng trong TOPIK.'),
      o(4, 6, '🌏', 'Toàn cầu hóa', '세계화', '-(으)ㄴ/는 데 반해, -는 한.'),
    ],
  },
];

export const ALL_UNIT_OUTLINES = LEVELS.flatMap((l) => l.units);
