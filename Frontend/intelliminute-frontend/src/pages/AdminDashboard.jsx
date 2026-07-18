"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext.jsx";
import {
  deleteAdminUser,
  getAdminUserMeetings,
  getAdminUsers,
  getAdminDashboard,
} from "../services/api.js";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    loadDashboard();
    loadUsers();
  }, []);
  async function loadDashboard() {
    try {
      const res = await getAdminDashboard();
      const dashData = res?.data ?? res;
      setDashboard(dashData);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadUsers() {
    try {
      const res = await getAdminUsers();
      const userList = res?.data ?? (Array.isArray(res) ? res : []);
      setUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------------- */

  async function loadMeetings(u) {
    setSelectedUser(u);
    setSelectedMeeting(null);

    setMeetings([]);
    setMeetingsLoading(true);

    try {
      const res = await getAdminUserMeetings(u.id);
      const meetingList = res?.data ?? (Array.isArray(res) ? res : []);
      setMeetings(meetingList);
    } catch (err) {
      console.error(err);
    } finally {
      setMeetingsLoading(false);
    }
  }

  /* ---------------------------------------------------- */

  async function handleDeleteUser(userId) {
    if (!window.confirm("Delete this user and all associated meetings?"))
      return;

    try {
      await deleteAdminUser(userId);

      setUsers((prev) => prev.filter((u) => u.id !== userId));

      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setMeetings([]);
        setSelectedMeeting(null);
      }

      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();

    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const totalUsers =
    typeof dashboard?.users === "object"
      ? (dashboard?.users?.total ?? 0)
      : typeof dashboard?.users === "number"
        ? dashboard.users
        : 0;

  const adminUsers =
    typeof dashboard?.users === "object"
      ? (dashboard?.users?.admins ?? 0)
      : null;

  const proUsers =
    typeof dashboard?.users === "object"
      ? (dashboard?.users?.pro_users ?? 0)
      : null;

  const totalMeetings =
    typeof dashboard?.meetings === "object"
      ? (dashboard?.meetings?.total ?? 0)
      : typeof dashboard?.meetings === "number"
        ? dashboard.meetings
        : 0;

  const failedMeetings =
    typeof dashboard?.meetings === "object"
      ? (dashboard?.meetings?.failed ?? 0)
      : null;

  const warningCount =
    typeof dashboard?.meetings === "object"
      ? (dashboard?.meetings?.warnings_generated ?? 0)
      : null;

  const overallAccuracy =
    dashboard?.runtime_metrics?.overall_confidence ??
    dashboard?.accuracy?.overall_accuracy ??
    null;

  const classificationAccuracy =
    dashboard?.training_metrics?.classification_accuracy ??
    dashboard?.accuracy?.classification_accuracy ??
    null;

  const precision =
    dashboard?.training_metrics?.precision ??
    dashboard?.accuracy?.precision ??
    null;

  const recall =
    dashboard?.training_metrics?.recall ?? dashboard?.accuracy?.recall ?? null;

  const f1Score =
    dashboard?.training_metrics?.f1_score ??
    dashboard?.accuracy?.f1_score ??
    null;

  const summarySimilarity =
    dashboard?.training_metrics?.summary_similarity ??
    dashboard?.accuracy?.summary_similarity ??
    null;

  const trainingSamples =
    dashboard?.training_metrics?.training_samples ??
    dashboard?.accuracy?.training_samples ??
    null;

  const systemHealth =
    typeof dashboard?.system_health === "string"
      ? dashboard.system_health
      : typeof dashboard?.system_health?.status === "string"
        ? dashboard.system_health.status
        : "Healthy";

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] font-sans antialiased text-[#1a1a1a]">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[270px] shrink-0 bg-[#181714] text-white flex flex-col justify-between p-7 min-h-screen sticky top-0">
        <div>
          {/* Logo */}
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-white">
              IntelliMinute
            </h1>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2d2c29] my-7" />

          {/* Admin User Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#2d2c29] border border-[#3d3c38] flex items-center justify-center text-base font-bold text-amber-400 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate text-white">
                {user?.name || "Administrator"}
              </p>
              <p className="text-xs text-[#8f8b84] truncate">
                {user?.email || "admin@intelliminute.ai"}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2d2c29] my-7" />

          {/* System Status */}
          <div>
            <p className="text-[10px] uppercase tracking-[2px] font-semibold text-[#888] mb-4">
              System Status
            </p>

            <div className="space-y-3.5">
              <div className="bg-[#22211e] p-3 rounded-xl border border-[#2d2c29]">
                <p className="text-[11px] text-[#8c8c8c]">Backend</p>
                <p className="text-xs font-semibold mt-0.5 text-emerald-400">
                  {dashboard?.backend_status || "Running"}
                </p>
              </div>

              <div className="bg-[#22211e] p-3 rounded-xl border border-[#2d2c29]">
                <p className="text-[11px] text-[#8c8c8c]">AI Model</p>
                <p className="text-xs font-semibold mt-0.5 text-indigo-300 truncate">
                  {dashboard?.model_status || "Loaded"}
                </p>
              </div>

              <div className="bg-[#22211e] p-3 rounded-xl border border-[#2d2c29]">
                <p className="text-[11px] text-[#8c8c8c]">Database</p>
                <p className="text-xs font-semibold mt-0.5 text-sky-400">
                  {dashboard?.database_status || "Connected (Mongo DB)"}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2d2c29] my-7" />

          {/* Quick Statistics */}
          <div>
            <p className="text-[10px] uppercase tracking-[2px] font-semibold text-[#888] mb-4">
              Quick Overview
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#999]">Users</span>
                <span className="font-bold text-white bg-[#282723] px-2.5 py-0.5 rounded-md">
                  {totalUsers}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#999]">Meetings</span>
                <span className="font-bold text-white bg-[#282723] px-2.5 py-0.5 rounded-md">
                  {totalMeetings}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#999]">Avg Accuracy</span>
                <span className="font-bold text-emerald-400 bg-[#282723] px-2.5 py-0.5 rounded-md">
                  {overallAccuracy !== null && overallAccuracy !== undefined
                    ? `${Number(overallAccuracy).toFixed(1)}%`
                    : "--"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2d2c29] mt-6">
          <button
            onClick={logout}
            className="w-full rounded-xl border border-[#3b3a36] py-2.5 text-xs font-semibold text-[#ccc] hover:text-white hover:bg-[#252421] hover:border-[#4d4c47] transition flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <section className="px-10 pt-8 pb-4">
          {/* Primary Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Users */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#ececec]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#888]">
                Total Users
              </p>
              <h2 className="text-3xl font-extrabold text-[#111] mt-2">
                {totalUsers}
              </h2>
              <p className="text-xs text-[#777] mt-2 flex items-center gap-1">
                {adminUsers !== null && proUsers !== null
                  ? `${proUsers} Pro • ${adminUsers} Admins`
                  : "Registered platform accounts"}
              </p>
            </div>

            {/* Meetings Processed */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#ececec]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#888]">
                Meetings Processed
              </p>
              <h2 className="text-3xl font-extrabold text-[#111] mt-2">
                {totalMeetings}
              </h2>
              <p className="text-xs text-[#777] mt-2">
                {failedMeetings !== null && warningCount !== null
                  ? `${failedMeetings} Failed • ${warningCount} Warnings`
                  : "Stored meeting transcript records"}
              </p>
            </div>

            {/* Average AI Accuracy */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#ececec]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#888]">
                Average AI Accuracy
              </p>
              <h2 className="text-3xl font-extrabold text-[#111] mt-2 text-emerald-600">
                {overallAccuracy !== null && overallAccuracy !== undefined
                  ? `${Number(overallAccuracy).toFixed(1)}%`
                  : "--"}
              </h2>
              <p className="text-xs text-[#777] mt-2">
                Across all analyzed meetings
              </p>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#ececec]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#888]">
                System Health
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full ring-4 ${
                    systemHealth === "Healthy"
                      ? "bg-emerald-500 ring-emerald-100"
                      : systemHealth === "Warning"
                        ? "bg-amber-500 ring-amber-100"
                        : "bg-red-500 ring-red-100"
                  }`}
                />
                <h2 className="text-2xl font-bold text-[#1a1a1a]">
                  {systemHealth}
                </h2>
              </div>
              <p className="text-xs text-[#777] mt-3">
                Live operational status
              </p>
            </div>
          </div>

          {/* AI Model Performance Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-5">
            <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                Accuracy
              </p>
              <h3 className="text-xl font-bold text-[#222] mt-1">
                {classificationAccuracy ?? "--"}%
              </h3>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                Precision
              </p>
              <h3 className="text-xl font-bold text-[#222] mt-1">
                {precision ?? "100"}%
              </h3>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                Recall
              </p>
              <h3 className="text-xl font-bold text-[#222] mt-1">
                {recall ?? "--"}%
              </h3>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                F1 Score
              </p>
              <h3 className="text-xl font-bold text-[#222] mt-1">
                {f1Score ?? "--"}%
              </h3>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                Similarity
              </p>
              <h3 className="text-xl font-bold text-[#222] mt-1">
                {summarySimilarity ?? "--"}%
              </h3>
            </div>
          </div>
        </section>

        {/* ================= MAIN THREE-COLUMN WORKSPACE ================= */}
        <div className="px-10 py-6 flex gap-6 items-start flex-1 min-h-[700px]">
          {/* ================= USERS PANEL ================= */}
          <div className="w-[340px] shrink-0">
            <div className="bg-white rounded-2xl border border-[#ececec] shadow-xs overflow-hidden flex flex-col h-[780px]">
              {/* Users Header & Search */}
              <div className="px-5 py-4 border-b border-[#efefef] bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#1a1a1a]">
                      Users
                    </h2>
                    <p className="text-xs text-[#8b8b8b] mt-0.5">
                      {filteredUsers.length} registered accounts
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mt-3.5">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search user by name or email..."
                    className="w-full rounded-xl border border-[#e6e6e6] bg-[#fafafa] px-3.5 py-2.5 text-xs outline-none focus:border-black focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#f4f4f4]">
                {loading && (
                  <div className="p-6 text-center text-xs text-[#888]">
                    Loading users...
                  </div>
                )}

                {!loading && filteredUsers.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#888]">
                    No users found.
                  </div>
                )}

                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => loadMeetings(u)}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedUser?.id === u.id
                        ? "bg-[#faf8f5] border-l-4 border-l-black"
                        : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#181818] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-xs text-[#1a1a1a] truncate">
                            {u.name}
                          </h3>
                          <p className="text-[11px] text-[#888] truncate mt-0.5">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      {u.role === "admin" && (
                        <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] uppercase tracking-wider font-semibold shrink-0">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* User Badges */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f3f3f3] text-[10px] font-medium text-[#666]">
                        {u.meeting_count} Meetings
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.subscribed
                            ? "bg-[#edf8ef] text-[#22743b]"
                            : "bg-[#f6f6f6] text-[#888]"
                        }`}
                      >
                        {u.subscribed ? "Pro" : "Free"}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f7f7f7]">
                      <span className="text-[10px] text-[#9b9b9b]">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(u.id);
                        }}
                        className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= MEETINGS PANEL ================= */}
          <div className="w-[380px] shrink-0">
            <div className="bg-white rounded-2xl border border-[#ececec] shadow-xs overflow-hidden flex flex-col h-[780px]">
              {/* Meetings Header */}
              <div className="px-5 py-4 border-b border-[#efefef] bg-white">
                <h2 className="text-base font-bold text-[#1a1a1a]">
                  Meeting History
                </h2>
                <p className="text-xs text-[#888] mt-0.5 truncate">
                  {selectedUser
                    ? `Showing meetings for ${selectedUser.name}`
                    : "Select a user from the left list"}
                </p>
              </div>

              {!selectedUser ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-[#999] text-xs">
                  Select a user to view their processed meeting records.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-[#f1f1f1]">
                  {meetingsLoading && (
                    <div className="p-6 text-center text-xs text-[#888]">
                      Loading meetings...
                    </div>
                  )}

                  {!meetingsLoading && meetings.length === 0 && (
                    <div className="p-6 text-center text-xs text-[#888]">
                      No meetings available for this user.
                    </div>
                  )}

                  {meetings.map((meeting) => {
                    const confidence =
                      meeting.quality_metrics?.overall_confidence ?? 0;
                    const failed = confidence < 35;

                    return (
                      <div
                        key={meeting.id}
                        onClick={() => setSelectedMeeting(meeting)}
                        className={`p-4 cursor-pointer transition ${
                          selectedMeeting?.id === meeting.id
                            ? "bg-[#faf8f5] border-l-4 border-l-amber-700"
                            : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="overflow-hidden">
                            <h3 className="font-semibold text-xs text-[#1a1a1a] line-clamp-1">
                              {meeting.title || "Untitled Meeting"}
                            </h3>
                            <p className="text-[10px] text-[#888] mt-0.5">
                              {new Date(meeting.created_at).toLocaleString()}
                            </p>
                          </div>

                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              failed
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {failed ? "Failed" : "Completed"}
                          </span>
                        </div>

                        {/* Audio File */}
                        <div className="mt-2.5">
                          <p className="text-[9px] uppercase tracking-wider font-semibold text-[#999]">
                            Audio File
                          </p>
                          <p className="text-xs mt-0.5 text-[#555] truncate font-mono bg-[#f8f8f8] px-2 py-1 rounded border border-[#efefef]">
                            {meeting.audio_filename || "Unknown"}
                          </p>
                        </div>

                        {/* Meeting Type Tags */}
                        <div className="flex gap-1.5 mt-2.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#f3f3f3] text-[10px] font-medium text-[#555]">
                            {meeting.meeting_type}
                          </span>
                          {meeting.quality_metrics?.detected_meeting_type && (
                            <span className="px-2 py-0.5 rounded-md bg-[#eef5ff] text-[10px] font-medium text-[#2862d8]">
                              {meeting.quality_metrics.detected_meeting_type}
                            </span>
                          )}
                        </div>

                        {/* Confidence Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-medium text-[#666] mb-1">
                            <span>AI Confidence</span>
                            <span className="font-bold">
                              {confidence.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#ececec] overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                confidence >= 75
                                  ? "bg-emerald-500"
                                  : confidence >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer Counts */}
                        <div className="flex justify-between mt-3 text-[10px] text-[#888] pt-2 border-t border-[#f7f7f7]">
                          <span>
                            Participants: {meeting.participants?.length || 0}
                          </span>
                          <span>
                            Actions: {meeting.action_items?.length || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ================= DETAIL INSPECTION PANEL ================= */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#ececec] shadow-xs h-[780px] overflow-hidden flex flex-col">
              {!selectedMeeting ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#faf8f5]">
                  <div className="w-16 h-16 rounded-2xl border border-[#e5ddd2] flex items-center justify-center bg-white shadow-xs mb-4">
                    <svg
                      className="w-8 h-8 stroke-[#8f7c63]"
                      fill="none"
                      strokeWidth="1.7"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h8m-8 4h5m-5-8h8M4 3h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-[#222]">
                    No Meeting Selected
                  </h2>
                  <p className="mt-2 text-xs text-[#888] max-w-sm leading-relaxed">
                    Choose a meeting record from the center list to inspect AI
                    transcript analysis, confidence scores, participant list,
                    decision items, and model warnings.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 bg-[#faf8f5] space-y-6">
                  {/* Header */}
                  <div className="bg-white p-6 rounded-2xl border border-[#ece7df] shadow-xs">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-[#1a1a1a]">
                          {selectedMeeting.title || "Untitled Meeting"}
                        </h1>
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#efe9df] text-[#7a6448] text-xs font-semibold">
                            {selectedMeeting.meeting_type}
                          </span>
                          <span className="text-xs text-[#777]">
                            {new Date(
                              selectedMeeting.created_at,
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Quality Metrics */}
                  {selectedMeeting.quality_metrics && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <MetricCard
                        title="Overall"
                        value={
                          selectedMeeting.quality_metrics.overall_confidence
                        }
                      />
                      <MetricCard
                        title="Transcript"
                        value={
                          selectedMeeting.quality_metrics.transcript_quality
                        }
                      />
                      <MetricCard
                        title="Summary"
                        value={
                          selectedMeeting.quality_metrics.summary_confidence
                        }
                      />
                      <MetricCard
                        title="Meeting Match"
                        value={
                          selectedMeeting.quality_metrics.meeting_type_match
                        }
                      />
                      <MetricCard
                        title="Detected Type"
                        text={
                          selectedMeeting.quality_metrics.detected_meeting_type
                        }
                      />
                    </div>
                  )}

                  {/* Meeting Summary */}
                  <Panel title="Meeting Summary">
                    {Array.isArray(selectedMeeting.summary) ? (
                      <ul className="space-y-2.5">
                        {selectedMeeting.summary.map((s, i) => (
                          <li
                            key={i}
                            className="bg-[#fcfbf9] border border-[#ece7df] rounded-xl p-3.5 text-xs text-[#333] leading-relaxed"
                          >
                            • {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs leading-relaxed text-[#444] bg-[#fcfbf9] border border-[#ece7df] rounded-xl p-4">
                        {selectedMeeting.summary || "No summary available."}
                      </p>
                    )}
                  </Panel>

                  {/* Participants */}
                  <Panel title="Participants">
                    {!selectedMeeting.participants?.length ? (
                      <p className="text-xs text-[#999]">
                        No participants detected.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedMeeting.participants.map((p, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-full bg-[#f2eee9] text-xs font-medium text-[#444] border border-[#e5ddd2]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </Panel>

                  {/* Actions & Decisions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Panel title="Action Items">
                      {!selectedMeeting.action_items?.length ? (
                        <p className="text-xs text-[#999]">
                          No action items detected.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {selectedMeeting.action_items.map((item, i) => (
                            <li
                              key={i}
                              className="text-xs p-3 rounded-xl bg-[#fcfbf9] border border-[#ece7df] text-[#333] flex items-start gap-2"
                            >
                              <span className="text-amber-700 font-bold">
                                •
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Panel>

                    <Panel title="Decision Items">
                      {!selectedMeeting.decision_items?.length ? (
                        <p className="text-xs text-[#999]">
                          No decision items detected.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {selectedMeeting.decision_items.map((item, i) => (
                            <li
                              key={i}
                              className="text-xs p-3 rounded-xl bg-[#fcfbf9] border border-[#ece7df] text-[#333] flex items-start gap-2"
                            >
                              <span className="text-emerald-700 font-bold">
                                ✓
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Panel>
                  </div>

                  {/* System Warnings */}
                  {selectedMeeting.quality_metrics?.warnings?.length > 0 && (
                    <Panel title="System Warnings">
                      <div className="rounded-xl border border-[#e7d6bf] bg-[#fff8ef] p-4 space-y-2">
                        {selectedMeeting.quality_metrics.warnings.map(
                          (w, i) => (
                            <p
                              key={i}
                              className="text-xs text-[#8a6943] font-medium flex items-center gap-2"
                            >
                              <span>⚠️</span> {w}
                            </p>
                          ),
                        )}
                      </div>
                    </Panel>
                  )}

                  {/* Transcript */}
                  <Panel title="Transcript">
                    <div className="rounded-xl bg-[#181818] text-[#d6d6d6] p-5 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto border border-[#333]">
                      {selectedMeeting.transcript || "Transcript unavailable."}
                    </div>
                  </Panel>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function MetricCard({ title, value, text }) {
  const score = Number(value || 0);

  return (
    <div className="rounded-xl bg-white border border-[#ece7df] p-4 shadow-2xs">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888] mb-1">
        {title}
      </p>

      {text ? (
        <h2 className="text-xs font-bold text-[#222] capitalize mt-1.5 truncate">
          {text.replace("_", " ")}
        </h2>
      ) : (
        <>
          <h2 className="text-xl font-bold text-[#222] mt-1">
            {Math.round(score)}%
          </h2>

          <div className="mt-2.5 h-1.5 rounded-full bg-[#eee] overflow-hidden">
            <div
              className={`h-full transition-all ${
                score >= 80
                  ? "bg-emerald-500"
                  : score >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{
                width: `${Math.min(score, 100)}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#ece7df] p-5 shadow-2xs">
      <h3 className="text-sm font-bold text-[#222] mb-3">{title}</h3>
      {children}
    </div>
  );
}
