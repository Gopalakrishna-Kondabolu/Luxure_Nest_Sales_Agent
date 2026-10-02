"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Tag, User, RefreshCw, CheckCircle2, Clock3, XCircle } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          style: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          icon: Clock3,
        };
      case "CONFIRMED":
        return {
          style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
        };
      case "CANCELLED":
        return {
          style: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: XCircle,
        };
      default:
        return {
          style: "bg-gray-500/20 text-gray-400 border-gray-500/30",
          icon: Clock3,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appointments & Bookings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Client consultation schedules and booking requests (Default initial status is PENDING)
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl glass-panel p-6">
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500">No bookings recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Appointment Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-200">
                {bookings.map((booking) => {
                  const badge = getStatusBadge(booking.status);
                  const Icon = badge.icon;
                  return (
                    <tr key={booking.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                        {booking.id.substring(0, 13)}...
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-sky-400" />
                          {booking.service_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 text-gray-300">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {booking.booking_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-sky-300">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-400" />
                          {booking.booking_time}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.style}`}>
                          <Icon className="h-3 w-3" />
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
