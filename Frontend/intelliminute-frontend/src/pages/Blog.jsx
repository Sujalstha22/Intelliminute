import React, { useState, useEffect } from 'react';

const blogPosts = [
  {
    id: 1,
    tag: "PRODUCTIVITY",
    title: "Why you should stop taking meeting minutes manually",
    excerpt: "The average professional spends 3 hours a week writing up notes. Here is why that's a massive waste of your team's potential.",
    content: "The average professional spends over 3 hours a week just drafting, formatting, and chasing people for meeting minutes. That translates to hundreds of hours a year lost to administrative overhead.\n\nWhen we take notes manually, we're not fully present in the meeting. We miss nuanced points, body language, and the actual creative problem-solving that meetings are supposed to be for. Furthermore, human memory is fallible. Have you ever argued over what was agreed upon because the notes were vague? \n\nBy leveraging tools like IntelliMinute, we can offload the clerical work to AI. It listens, transcribes accurately, and formats decisions instantly, allowing humans to do what they do best: engage, strategize, and connect.",
    author: "Elena R.",
    date: "Mar 12, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800&h=500",
  },
  {
    id: 2,
    tag: "AI & WORK",
    title: "How to use AI to track decisions across your team",
    excerpt: "Decisions often get lost in Slack threads and hour-long Zoom calls. Learn how AI transcription can create a single source of truth.",
    content: "We've all been there: a critical decision is made in a 45-minute Zoom call, but exactly who is responsible for what gets lost in translation. Relying on memory or disorganized Slack threads kills momentum.\n\nAI isn't just about replacing human effort; it's about amplifying alignment. Modern speech recognition can isolate action items precisely as they occur in a conversation. \n\nInstead of interpreting what was said, teams can refer back to the exact transcript and auto-generated action points. This creates a definitive 'single source of truth' that prevents endless follow-ups and unblocks projects faster.",
    author: "Marcus T.",
    date: "Feb 28, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800&h=500",
  },
  {
    id: 3,
    tag: "BEST PRACTICES",
    title: "The anatomy of perfect meeting notes",
    excerpt: "From executive summaries to clear action items. We analyzed 10,000 meeting minutes to find out what actually works.",
    content: "What separates good meeting notes from great ones? After analyzing 10,000 sets of meeting minutes, the data points to three key elements: brevity, clear ownership, and immediate context.\n\n1. Brevity: Nobody reads a 4-page transcript. Executive summaries of 3-4 bullet points are read 80% more often.\n2. Clear Ownership: Action items must clearly state WHO is doing WHAT by WHEN. If an action item lacks a specific name and date, it's virtually guaranteed to be delayed.\n3. Immediate Context: Linking back to the specific timestamp or recording ensures that if there's confusion, the source material is one click away.\n\nUsing these practices drastically cuts down on alignment times and boosts successful project completion.",
    author: "Sarah J.",
    date: "Feb 15, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800&h=500",
  },
  {
    id: 4,
    tag: "CULTURE",
    title: "Death by a thousand syncs: Curing meeting fatigue",
    excerpt: "When every update is a meeting, work doesn't happen. How to shift to an async-first culture without losing alignment.",
    content: "Meeting fatigue is one of the most cited reasons for burnout in modern remote and hybrid teams. A culture of excessive 'syncs' implies a lack of trust in asynchronous communication.\n\nTo cure this, companies need to default to async. This means reserving real-time meetings for complex debates, emotional checkpoints, or high-stakes brainstorming. Routine updates should be documented and distributed.\n\nWhen you do meet, ensure a strict agenda. Having automated transcriptions available afterward means team members who were optional don't feel FOMO (Fear Of Missing Out) and can easily catch up by reading the synthesized notes in 2 minutes instead of sitting silently for 30 minutes.",
    author: "David K.",
    date: "Jan 30, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800&h=500",
  },
  {
    id: 5,
    tag: "PRODUCTIVITY",
    title: "The 15-minute meeting framework",
    excerpt: "If it takes longer than 15 minutes, you're doing it wrong. A controversial but effective approach to team syncs.",
    content: "Parkinson's Law states that work expands to fill the time allotted for its completion. If you schedule a 60-minute meeting, it will take 60 minutes, regardless of the agenda.\n\nThe 15-minute meeting framework enforces rigorous pre-reading and strict focus. No context setting is allowed in the meeting itself. Everyone must read the brief beforehand.\n\nThe 15 minutes are used solely for rapid-fire alignment, debating open questions, and assigning next steps. It feels uncomfortable at first, but teams who adopt this often find they reclaim entire days of their work week.",
    author: "Elena R.",
    date: "Jan 12, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1507925922841-f76ea1ed1c21?auto=format&fit=crop&q=80&w=800&h=500",
  },
  {
    id: 6,
    tag: "AI & WORK",
    title: "Hallucinations in AI: Trusting your automated minutes",
    excerpt: "How IntelliMinute combats AI hallucinations to ensure your board meeting notes are 100% legally and factually accurate.",
    content: "As LLMs become ubiquitous, 'hallucinations'—where AI invents facts with absolute confidence—have become a critical concern, especially for legal or board-level minute-taking.\n\nAt IntelliMinute, we employ a multi-layered verification approach. First, the acoustic transcription layer translates speech verbatim without creative license. Second, the summarization layer is strictly prompted to anchor only to the transcription context, penalizing any unverified additions.\n\nFinally, keeping the raw audio alongside the action items ensures humans maintain the ultimate oversight, providing trust and verify mechanics rather than blind faith.",
    author: "Alex W.",
    date: "Dec 05, 2025",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800&h=500",
  }
];

const Blog = () => {
    const [selectedPost, setSelectedPost] = useState(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedPost) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [selectedPost]);

    return (
        <div className="min-h-screen bg-[#fcfbf9] text-[#2c2c2c] font-inter">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap');
                .font-inter { font-family: 'Inter', sans-serif; }
                .font-playfair { font-family: 'Playfair Display', serif; }
                
                .human-underline {
                    position: relative;
                    white-space: nowrap;
                    display: inline-block;
                }
                .human-underline::after {
                    content: '';
                    position: absolute;
                    bottom: 4px;
                    left: -2%;
                    width: 104%;
                    height: 8px;
                    background-color: rgba(200, 169, 126, 0.3);
                    transform: rotate(-1.5deg);
                    z-index: -1;
                    border-radius: 3px;
                }

                @keyframes subtleUp { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
                @keyframes modalFadeIn { from{opacity:0;} to{opacity:1;} }
                @keyframes modalScaleUp { from{opacity:0;transform:scale(0.97) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
                
                .anim-up { animation: subtleUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .anim-fade-in { animation: modalFadeIn 0.3s ease forwards; }
                .anim-scale-up { animation: modalScaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                .delay-1 { animation-delay: 0.1s; opacity: 0; }
                .delay-2 { animation-delay: 0.2s; opacity: 0; }
                .delay-3 { animation-delay: 0.3s; opacity: 0; }
                .delay-4 { animation-delay: 0.4s; opacity: 0; }
            `}</style>
            
            {/* ── Page Header ── */}
            <header className="max-w-[1100px] mx-auto px-6 py-20 md:py-32 anim-up delay-1">
                <div className="max-w-[700px]">
                    <h1 className="font-playfair text-[clamp(42px,5.5vw,72px)] leading-[1.05] tracking-tight text-[#111] mb-6">
                        The <span className="human-underline italic">Journal</span>
                    </h1>
                    <p className="text-[18px] font-light text-[#555] leading-relaxed">
                        Essays and guides on making your meetings more productive, documenting decisions, and reclaiming your focused work time.
                    </p>
                </div>
            </header>

            {/* ── Featured / Latest Post ── */}
            <section className="max-w-[1100px] mx-auto px-6 mb-20 md:mb-32 anim-up delay-2">
                {/* Hand-drawn aesthetic border around the featured post */}
                <div 
                    className="relative isolate group cursor-pointer block"
                    onClick={() => setSelectedPost(blogPosts[0])}
                >
                    <div className="absolute -inset-3 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border border-[#e2dfd8] -z-10 bg-white transition-all group-hover:bg-[#faf9f6]"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
                        <div className="rounded-xl overflow-hidden shadow-sm aspect-[4/3] md:aspect-auto h-full max-h-[460px]">
                            <img 
                                src={blogPosts[0].image} 
                                alt={blogPosts[0].title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                        <div className="flex flex-col items-start pr-4 pb-6 md:pb-0">
                            <div className="text-[#c8a97e] text-[12px] uppercase tracking-widest font-medium mb-4">
                                {blogPosts[0].tag}
                            </div>
                            <h2 className="font-playfair text-3xl md:text-5xl leading-tight tracking-tight text-[#1a1a1a] mb-5 group-hover:text-[#a88a65] transition-colors">
                                {blogPosts[0].title}
                            </h2>
                            <p className="text-[16px] font-light text-[#6a6a6a] leading-relaxed mb-8">
                                {blogPosts[0].excerpt}
                            </p>
                            <div className="flex items-center justify-between w-full mt-auto pt-6 border-t border-[#f0ede6] text-[#888] text-[13px] font-light">
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#111] text-white flex items-center justify-center text-[9px] font-medium">{blogPosts[0].author.charAt(0)}</span>
                                    {blogPosts[0].author}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span>{blogPosts[0].date}</span>
                                    <span>{blogPosts[0].readTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── All Posts Grid ── */}
            <section className="bg-white border-y border-[#f0ede6] anim-up delay-3">
                <div className="max-w-[1100px] mx-auto px-6 py-24">
                    <div className="flex items-center justify-between mb-16">
                        <h3 className="font-playfair text-2xl text-[#111] italic">Older Entries —</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                        {blogPosts.slice(1).map((post) => (
                            <div 
                                key={post.id} 
                                onClick={() => setSelectedPost(post)}
                                className="group flex flex-col items-start cursor-pointer"
                            >
                                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-6 bg-[#f4f1ea] relative">
                                    {/* Subtle overlay effect */}
                                    <div className="absolute inset-0 bg-[#c8a97e]/0 group-hover:bg-[#c8a97e]/10 transition-colors z-10 duration-300"></div>
                                    <img 
                                        src={post.image} 
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                    />
                                </div>
                                <div className="text-[#c8a97e] text-[11px] uppercase tracking-widest font-medium mb-3">
                                    {post.tag}
                                </div>
                                <h4 className="font-playfair text-[22px] leading-snug tracking-tight text-[#1a1a1a] mb-4 group-hover:text-[#a88a65] transition-colors">
                                    {post.title}
                                </h4>
                                <p className="text-[14px] font-light text-[#6a6a6a] leading-relaxed mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="w-full mt-auto pt-5 border-t border-[#f4f1ea] flex items-center justify-between text-[#888] text-[12px] font-light">
                                    <span>{post.author}</span>
                                    <span>{post.readTime}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* ── Footer ── */}
            <footer className="max-w-[1100px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 text-[#999] text-[13px] anim-up delay-4">
                <p>© {new Date().getFullYear()} IntelliMinute.</p>
                <p>Because you have better things to do than formatting notes.</p>
            </footer>

            {/* ── Modal ── */}
            {selectedPost && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#1a1a1a]/40 backdrop-blur-[2px] anim-fade-in focus:outline-none"
                    onClick={() => setSelectedPost(null)}
                    style={{ zIndex: 99999 }}
                >
                    <div 
                        className="bg-[#fcfbf9] w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative flex flex-col anim-scale-up border border-[#e2dfd8]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white/80 backdrop-blur-md shadow-sm border border-[#e2dfd8] rounded-full flex items-center justify-center text-[#555] hover:text-black hover:bg-white transition-all z-10"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </button>
                        
                        <div className="w-full h-[240px] md:h-[350px] shrink-0 relative bg-[#f4f1ea]">
                            <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="p-8 md:p-14 max-w-3xl mx-auto w-full">
                            <div className="text-[#c8a97e] text-[12px] uppercase tracking-widest font-medium mb-4">
                                {selectedPost.tag}
                            </div>
                            <h2 className="font-playfair text-3xl md:text-5xl leading-tight tracking-tight text-[#1a1a1a] mb-8">
                                {selectedPost.title}
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-4 text-[#888] text-[13px] font-light pb-8 mb-8 border-b border-[#f0ede6]">
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#111] text-white flex items-center justify-center text-[10px] font-medium">{selectedPost.author.charAt(0)}</span>
                                    {selectedPost.author}
                                </span>
                                <span>•</span>
                                <span>{selectedPost.date}</span>
                                <span>•</span>
                                <span>{selectedPost.readTime}</span>
                            </div>

                            <div className="text-[#444] text-[17px] font-light leading-[1.8] whitespace-pre-line font-inter">
                                {selectedPost.content}
                            </div>
                            
                            <div className="mt-16 text-center">
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="px-6 py-2.5 bg-white border border-[#e2dfd8] rounded-full text-[14px] text-[#555] hover:text-[#111] hover:border-[#111] transition-colors font-medium cursor-pointer"
                                >
                                    Back to Journal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blog;