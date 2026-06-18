import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { attendeeApi } from '../api/attendeeApi';

type ResponseStatus = 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';

const isValidStatus = (value: string | null): value is ResponseStatus =>
  value === 'ACCEPTED' || value === 'DECLINED' || value === 'TENTATIVE';

const statusText: Record<ResponseStatus, string> = {
  ACCEPTED: 'Đồng ý tham gia',
  TENTATIVE: 'Có thể tham gia',
  DECLINED: 'Từ chối tham gia',
};

export const PublicAttendeeResponsePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ResponseStatus | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<ResponseStatus | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResponse = async (responseStatus: ResponseStatus) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await attendeeApi.respondExternal(token, responseStatus);
      if (res.success) {
        setSubmittedStatus(responseStatus);
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi phản hồi. Token có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const quickStatus = searchParams.get('status');
    if (isValidStatus(quickStatus) && token && !submitted && !loading) {
      setStatus(quickStatus);
      submitResponse(quickStatus);
    }
  }, [searchParams, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      alert('Vui lòng chọn trạng thái phản hồi của bạn.');
      return;
    }
    await submitResponse(status);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-white">
        <div className="space-y-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center">
            <span className="text-2xl">FP</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Thư mời họp FlowPilot</h2>
            <p className="text-slate-300 text-sm mt-2">
              Bạn nhận được lời mời họp thông qua hệ thống FlowPilot.
            </p>
          </div>

          {loading && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl text-indigo-200">
              Đang ghi nhận phản hồi của bạn...
            </div>
          )}

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl text-center space-y-3">
              <h3 className="text-lg font-bold text-emerald-300">Gửi phản hồi thành công</h3>
              <p className="text-sm text-slate-300">
                Trạng thái của bạn: <span className="font-semibold text-white">{submittedStatus ? statusText[submittedStatus] : 'Đã phản hồi'}</span>.
              </p>
              <p className="text-sm text-slate-400">
                FlowPilot đã cập nhật phản hồi này vào lịch họp.
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
                  Vui lòng chọn phản hồi của bạn
                </label>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('ACCEPTED')}
                    className={`w-full py-3 px-4 rounded-xl font-semibold border text-center transition ${
                      status === 'ACCEPTED'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Đồng ý tham gia
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('TENTATIVE')}
                    className={`w-full py-3 px-4 rounded-xl font-semibold border text-center transition ${
                      status === 'TENTATIVE'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Có thể tham gia
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('DECLINED')}
                    className={`w-full py-3 px-4 rounded-xl font-semibold border text-center transition ${
                      status === 'DECLINED'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    Từ chối tham gia
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50"
              >
                Xác nhận phản hồi
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="text-slate-500 text-xs mt-6">FlowPilot Meeting Scheduling Automation © 2026</p>
    </div>
  );
};

export default PublicAttendeeResponsePage;
