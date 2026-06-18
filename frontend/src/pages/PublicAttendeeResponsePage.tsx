import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { attendeeApi } from '../api/attendeeApi';

export const PublicAttendeeResponsePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!status) {
      alert('Vui lòng chọn trạng thái phản hồi của bạn.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await attendeeApi.respondExternal(token, status);
      if (res.success) {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi phản hồi. Token có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]">
      <div className="w-full max-w-md bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
        
        {/* Subtle decorative background gradient inside card */}
        <div className="absolute -top-20 -left-20 h-40 w-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-violet-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 shadow-inner">
              <span className="text-3xl">📅</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Thư Mời Họp FlowPilot</h2>
            <p className="text-slate-300 text-sm mt-2">
              Bạn nhận được một thư mời họp thông qua hệ thống tự động hóa FlowPilot.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-3">
              <span className="text-4xl block">🎉</span>
              <h3 className="text-lg font-bold text-emerald-400">Gửi phản hồi thành công!</h3>
              <p className="text-sm text-slate-300">
                Cảm ơn bạn đã phản hồi lời mời họp. Thông tin đã được cập nhật vào quy trình.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                  Vui lòng chọn trạng thái tham gia của bạn
                </label>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('ACCEPTED')}
                    className={`w-full py-3.5 px-4 rounded-2xl font-semibold border text-center transition-all duration-200 ${
                      status === 'ACCEPTED'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    ✔️ Đồng ý tham gia (ACCEPTED)
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('TENTATIVE')}
                    className={`w-full py-3.5 px-4 rounded-2xl font-semibold border text-center transition-all duration-200 ${
                      status === 'TENTATIVE'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    🤔 Có thể tham gia (TENTATIVE)
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('DECLINED')}
                    className={`w-full py-3.5 px-4 rounded-2xl font-semibold border text-center transition-all duration-200 ${
                      status === 'DECLINED'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    ❌ Từ chối tham gia (DECLINED)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition duration-200 flex justify-center items-center disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  'Xác nhận Phản hồi'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="text-slate-500 text-xs mt-6">FlowPilot Meeting Scheduling Automation &copy; 2026</p>
    </div>
  );
};

export default PublicAttendeeResponsePage;
