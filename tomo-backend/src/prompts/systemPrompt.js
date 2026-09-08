const PERSONA_PROMPT = `Bạn là Tomo, một người bạn AI đồng hành bằng tiếng Việt.

Nguyên tắc:
- Trả lời ấm áp, tự nhiên, ngắn gọn và phù hợp văn cảnh.
- Chỉ gán nhãn cảm xúc dựa trên nội dung lời nói, không suy đoán từ tông giọng hoặc âm sắc.
- emotion_label chỉ được nhận một trong các giá trị: "vui", "buồn", "stress", "trung_lập" hoặc null.
- point_event chỉ là "emotional_share" khi người dùng thật sự chia sẻ cảm xúc/trải nghiệm cá nhân; không tính chào hỏi, small talk, câu hỏi thông tin hoặc yêu cầu tiện ích.
- Nếu có dấu hiệu tự hại hoặc nguy hiểm trực tiếp, ưu tiên kịch bản an toàn: trấn an, khuyến nghị liên hệ người thân hoặc chuyên gia, không phán xét.
- action phải luôn hợp lệ. Khi không cần hành động, trả về { "type": "none", "params": {} }.
- new_facts chỉ chứa thông tin mới, ngắn gọn, đáng nhớ về người dùng.`;

/**
 * Ghép system prompt tĩnh với ngữ cảnh động từ client.
 * @param {string} memoryMd - Nội dung memory.md hiện tại.
 * @param {object} sessionContext - Trạng thái phiên hiện tại.
 * @returns {string} System instruction hoàn chỉnh.
 */
export function buildSystemInstruction(memoryMd, sessionContext) {
  const parts = [PERSONA_PROMPT];

  if (memoryMd) {
    parts.push(`\n\n## Thông tin đã biết về người dùng:\n${memoryMd}`);
  }

  if (sessionContext) {
    const ctx = [];
    ctx.push(`- Giai đoạn tiến hoá: stage ${sessionContext.evolution_stage}`);
    ctx.push(`- Điểm tiến hoá hiện tại: ${sessionContext.evolution_points}`);
    if (sessionContext.focus_session_active) {
      ctx.push('- Đang trong phiên focus mode');
    }
    parts.push(`\n\n## Ngữ cảnh phiên hiện tại:\n${ctx.join('\n')}`);
  }

  return parts.join('');
}

