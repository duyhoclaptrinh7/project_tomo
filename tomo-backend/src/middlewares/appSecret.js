export function appSecret(_req, _res, next) {
  // Vị trí middleware cho giai đoạn deploy/chia sẻ APK. Phase 0 cố ý chưa kích hoạt.
  next();
}
