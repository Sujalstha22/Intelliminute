import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext.jsx";
import API, {
  deleteAdminUser,
  getAdminUserMeetings,
  getAdminUsers,
} from "../services/api.js";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  /* ── Fetch all users on mount ─────────────────────────────── */
  useEffect(() => {
    getAdminUsers()
      .then((r) => {
        setUsers(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const loadMeetings = async (u) => {
    console.log("Loading meetings for user:", u);
    setSelectedUser(u);
    setSelectedMeeting(null);
    setMeetings([]);
    setMeetingsLoading(true);
    try {
      const r = await getAdminUserMeetings(u.id);
      setMeetings(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all their meetings?")) return;
    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId)); // ← u.id directly
      if (selectedUser?.id === userId) {
        // ← .id directly
        setSelectedUser(null);
        setMeetings([]);
        setSelectedMeeting(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f4f0] font-sans">
      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="w-[200px] shrink-0 flex flex-col gap-4 bg-white border-r border-[#ede3d5] p-6">
        <div>
          <p className="text-base font-bold tracking-tight leading-none">
            IntelliMinute
          </p>
          <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-1.5">
            Admin
          </p>
        </div>

        <div className="flex items-center gap-2.5 mt-auto">
          <div className="w-8 h-8 rounded-full bg-[#444] flex items-center justify-center text-[13px] font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-[13px] font-medium truncate">{user?.name}</span>
        </div>

        <button
          onClick={logout}
          className="border border-[#333] rounded-lg py-2 px-3 text-xs text-[#aaa] bg-transparent cursor-pointer hover:border-[#555] hover:text-white transition-colors"
        >
          Sign out
        </button>
      </aside>

      {/* ── USER LIST ────────────────────────────────────────── */}
      <div className="w-[240px] shrink-0 bg-white border-r border-[#ececec] p-6 overflow-y-auto">
        <p className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-3">
          All users ({users.length})
        </p>

        {loading && <p className="text-[13px] text-[#999]">Loading…</p>}

        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => loadMeetings(u)}
              className={`bg-[#f8f8f6] rounded-xl p-3 cursor-pointer border-[1.5px] transition-colors ${
                selectedUser?.id === u.id
                  ? "border-[#1a1a1a]"
                  : "border-transparent hover:border-[#e0e0e0]"
              }`}
            >
              {/* Top row: avatar + name/email + role badge */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#1a1a1a] truncate leading-none mb-0.5">
                    {u.name}
                  </p>
                  <p className="text-[11px] text-[#888] truncate">{u.email}</p>
                </div>
                {u.role === "admin" && (
                  <span className="text-[10px] font-bold bg-[#1a1a1a] text-white px-1.5 py-0.5 rounded shrink-0">
                    Admin
                  </span>
                )}
              </div>

              {/* Meta chips */}
              <div className="flex gap-1.5 flex-wrap mb-2">
                <span className="text-[11px] bg-[#efefef] text-[#555] px-2 py-0.5 rounded-full">
                  {u.meeting_count ?? 0} meetings
                </span>
                {u.subscribed && (
                  <span className="text-[11px] bg-[#e8f4e8] text-[#2d7a2d] px-2 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(u.id);
                }}
                className="text-[11px] text-red-500 bg-transparent border-none cursor-pointer p-0 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEETING LIST ─────────────────────────────────────── */}
      <div className="w-[240px] shrink-0 bg-white border-r border-[#ececec] p-6 overflow-y-auto">
        {!selectedUser ? (
          <p className="text-[13px] text-[#999]">
            Select a user to view their meetings
          </p>
        ) : (
          <>
            <p className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-3">
              {selectedUser.name}'s meetings ({meetings.length})
            </p>

            {meetingsLoading && (
              <p className="text-[13px] text-[#999]">Loading…</p>
            )}

            {!meetingsLoading && meetings.length === 0 && (
              <p className="text-[13px] text-[#999]">No meetings yet</p>
            )}

            <div className="flex flex-col gap-2">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className={`bg-[#f8f8f6] rounded-xl p-3 cursor-pointer border-[1.5px] transition-colors ${
                    selectedMeeting?.id === m.id
                      ? "border-[#1a1a1a]"
                      : "border-transparent hover:border-[#e0e0e0]"
                  }`}
                >
                  <p className="text-[11px] text-[#999] mb-1">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-[#555] leading-relaxed">
                    {typeof m.summary === "string"
                      ? m.summary.slice(0, 70) + "…"
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── DETAIL PANEL ─────────────────────────────────────── */}
      <div className="flex-1 p-5 overflow-y-auto min-w-0">
        <div className="bg-white rounded-2xl p-7 min-h-full">
          {!selectedMeeting ? (
            <p className="text-[13px] text-[#999]">
              Select a meeting to view details
            </p>
          ) : (
            <>
              <p className="text-xs text-[#999] mb-6">
                {new Date(selectedMeeting.created_at).toLocaleString()}
              </p>
              <Block title="Summary" text={selectedMeeting.summary} />
              <ListBlock
                title="Participants"
                items={selectedMeeting.participants}
              />
              <ListBlock
                title="Action items"
                items={selectedMeeting.action_items}
              />
              <ListBlock
                title="Decision items"
                items={selectedMeeting.decision_items}
              />
              <Block
                title="Transcript"
                text={selectedMeeting.transcript}
                mono
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────────── */

function Block({ title, text, mono }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-[#999] uppercase tracking-wider mb-1.5">
        {title}
      </p>
      <p
        className={`text-[13px] leading-[1.7] text-[#333] ${
          mono ? "font-mono whitespace-pre-wrap" : ""
        }`}
      >
        {text || "—"}
      </p>
    </div>
  );
}

function ListBlock({ title, items }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-[#999] uppercase tracking-wider mb-1.5">
        {title}
      </p>
      {!items?.length ? (
        <p className="text-[13px] text-[#999]">None</p>
      ) : (
        <ul className="m-0 pl-[18px]">
          {items.map((x, i) => (
            <li key={i} className="text-[13px] leading-[1.7] text-[#333]">
              {x}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
