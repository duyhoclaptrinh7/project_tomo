/**
 * Xử lý gợi ý nhạc. Phase 0 giữ skeleton; logic grounding thật hoàn thiện ở Phase 6.
 * @returns {Promise<object>} Response hợp đồng music-suggest.
 */
export async function suggestMusic() {
  return {
    song_title: null,
    youtube_url: null,
    found: false,
  };
}
