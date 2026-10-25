/**
 * CLAUDE.md for a single deck: the deck's own memory for coding agents —
 * purpose, audience, voice, design rules and past corrections — so a new
 * chat session can pick up where the last one left off. Written once, never
 * overwritten. (Codex, Gemini and other agents read it fine; it is plain
 * Markdown.) deploy.mjs never publishes it.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const today = () => new Date().toISOString().slice(0, 10);

const EN = ({ title, template, source }) => `# ${title} — deck memory

Read this before changing the deck, and keep it current: when the user
corrects something, add it under "Decisions" so it isn't repeated.

## About
- Occasion / goal: <FILL IN>
- Audience: <FILL IN — who, what they already know>
- Length: <FILL IN> minutes · reading deck or speaking deck: <FILL IN>
- Language & voice: <FILL IN — e.g. plain, warm, few formulas>

## Design
- Template: \`${template}\`${source ? ` · built from ${source}` : ''} — keep its fonts, palette, layout grid and decoration
  (deck-kit AGENTS.md §3; full spec in templates/${template}/design.md)
- Colour meanings: <FILL IN — e.g. blue = prediction, orange = measurement>
- Rules: <FILL IN — e.g. max 4 bullets per slide, one idea per slide>

## Content
- Sources / facts to stick to: <FILL IN>
- Words or claims to avoid: <FILL IN>

## Decisions & corrections (newest first)
- ${today()} — deck created.

## Working on this deck
- \`index.html\` is the deck. Per slide: \`data-title\`, \`data-sec\`, \`data-min\`, and speaker notes in \`<aside class="notes">\`.
- The user may point at an element with **K** (copies file, line, slide and selector) — edit exactly that.
- After changes run check-deck.mjs; share with export.mjs or deploy.mjs (deck-kit/scripts).
`;

const VI = ({ title, template, source }) => `# ${title} — bộ nhớ của deck

Đọc file này trước khi sửa deck, và cập nhật nó: mỗi khi người dùng góp ý
hoặc sửa điều gì, ghi vào mục "Quyết định & góp ý" để không lặp lại lỗi cũ.

## Giới thiệu
- Dịp / mục tiêu: <ĐIỀN VÀO>
- Khán giả: <ĐIỀN VÀO — là ai, đã biết gì>
- Thời lượng: <ĐIỀN VÀO> phút · deck để đọc hay để nói: <ĐIỀN VÀO>
- Ngôn ngữ & giọng văn: <ĐIỀN VÀO — ví dụ: dễ hiểu, gần gũi, ít công thức>

## Thiết kế
- Mẫu: \`${template}\`${source ? ` · dựng từ ${source}` : ''} — giữ nguyên font, bảng màu, lưới bố cục và chi tiết trang trí
  (deck-kit AGENTS.md §3; mô tả đầy đủ ở templates/${template}/design.md)
- Ý nghĩa màu: <ĐIỀN VÀO — ví dụ: xanh dương = dự đoán, cam = phép đo>
- Quy tắc: <ĐIỀN VÀO — ví dụ: tối đa 4 gạch đầu dòng mỗi slide>

## Nội dung
- Nguồn / số liệu phải theo: <ĐIỀN VÀO>
- Từ ngữ hoặc khẳng định cần tránh: <ĐIỀN VÀO>

## Quyết định & góp ý (mới nhất ở trên)
- ${today()} — tạo deck.

## Cách làm việc với deck này
- \`index.html\` là deck. Mỗi slide có \`data-title\`, \`data-sec\`, \`data-min\`, ghi chú người nói trong \`<aside class="notes">\`.
- Người dùng có thể chỉ một phần tử bằng phím **K** (chép đường dẫn file, dòng, slide và selector) — sửa đúng phần tử đó.
- Sửa xong chạy check-deck.mjs; chia sẻ bằng export.mjs hoặc deploy.mjs (deck-kit/scripts).
`;

/** Create dir/CLAUDE.md unless one exists. Returns the path when written. */
export function writeDeckMemory(dir, { title = 'Deck', template = '', lang = 'en', source = '' } = {}) {
  const file = join(dir, 'CLAUDE.md');
  if (existsSync(file)) return null;
  writeFileSync(file, (String(lang).startsWith('vi') ? VI : EN)({ title, template, source }));
  return file;
}
