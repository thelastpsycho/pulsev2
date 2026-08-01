import { useState, useEffect, useRef } from 'react';
// ============================================================================
// AI Chat Assistant — natural-language queries over issues/rooms/guests/departments.
// OpenAI is called directly from the browser (VITE_OPENAI_API_KEY); tool calls
// are proxied through window.PulseAPI.Chat to the backend's /api/ai/tools/{name}.
// ============================================================================

const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, Avatar: () => null, Button: () => null, Card: () => null,
           EmptyState: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(' ') };
};

const getPulseLayout = () => {
  if (typeof window !== 'undefined' && window.PulseLayout) {
    return window.PulseLayout;
  }
  return { PageHeader: () => null };
};

const IconC = getPulseUI().Icon;
const AvatarC = getPulseUI().Avatar;
const ButtonC = getPulseUI().Button;
const CardC = getPulseUI().Card;
const EmptyC = getPulseUI().EmptyState;
const TC = getPulseUI().TOKENS;
const cxC = getPulseUI().cx;
const PageHeaderC = getPulseLayout().PageHeader;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'summary',
      description: 'Get issue statistics for a time period: totals, open/closed/urgent counts, average resolution time.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'yesterday', 'last_week', 'this_week', 'last_month', 'this_month'], description: 'Time period for the summary' },
          start_date: { type: 'string', description: 'Custom start date (YYYY-MM-DD), overrides period' },
          end_date: { type: 'string', description: 'Custom end date (YYYY-MM-DD), overrides period' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'room-search',
      description: 'Find issues reported for a specific room number.',
      parameters: {
        type: 'object',
        properties: {
          room_number: { type: 'string', description: 'Room number to search for' },
          limit: { type: 'integer', description: 'Max results (default 10)' },
        },
        required: ['room_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'guest-search',
      description: 'Find issues associated with a guest name.',
      parameters: {
        type: 'object',
        properties: {
          guest_name: { type: 'string', description: 'Guest name to search for' },
          limit: { type: 'integer', description: 'Max results (default 10)' },
        },
        required: ['guest_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'department-stats',
      description: 'Get issue counts and closure rates by department, ranked by volume.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'last_week', 'this_week', 'last_month'], description: 'Optional time period to scope the stats' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'urgent-issues',
      description: 'List currently open issues with urgent priority.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: 'Max results (default 20)' },
        },
      },
    },
  },
];

function getSystemPrompt() {
  const now = new Date();
  const today = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const readable = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `You are the GuestPulse Assistant, a helpful hotel operations assistant. You answer questions about issues, rooms, guests, and departments using the tools available to you. Always call a tool when the user asks for data you don't already have. Respond naturally and concisely, highlighting anything that needs attention (urgent issues, low closure rates, etc). If a tool returns no results, say so plainly rather than guessing.

Today's date is ${today} (${readable}). Use this as "now" for any relative date the user mentions (e.g. "yesterday", "last 3 days", "this week"). When the request matches one of the summary tool's period options (today, yesterday, last_week, this_week, last_month, this_month), use that. Otherwise compute start_date and end_date yourself (YYYY-MM-DD, relative to today's date above) rather than guessing a period or year.`;
}

const SUGGESTIONS = [
  'Show me the summary last week',
  'What happened to room 3122?',
  'Which department has the most issues?',
  'Show me urgent issues',
];

const LOADING_MESSAGES = [
  'Hacking the FBI mainframe…',
  'Contacting Iron Man…',
  'Flirting with Black Widow…',
  "Borrowing Thor's hammer…",
  'Asking Doctor Strange to check the multiverse…',
  'Contacting your ex…',
  'Googling "how to hotel"…',
  'Blaming housekeeping…',
  'Bribing the night auditor…',
  'Interrogating room 3122…',
  'Pretending to read the guest complaint…',
  'Rebooting the front desk printer (again)…',
  "Asking IT if they've tried turning it off and on…",
  "Counting towels that don't exist…",
  'Consulting the minibar spirits…',
  'Faxing corporate for approval…',
  'Untangling the phone cord…',
  'Reading the terms and conditions, all of them…',
  'Politely lying to a guest…',
  'Searching for the missing room key…',
  'Negotiating with the ice machine…',
  'Filing this under "someone else\'s problem"…',
  'Waiting for the elevator, again…',
  'Overthinking a five-star review…',
  'Calling Nick Fury for backup…',
  'Asking Spider-Man to swing by with towels…',
  'Debating philosophy with Thanos…',
  'Borrowing the Batmobile for a room inspection…',
  'Consulting Yoda on guest satisfaction…',
  'Sending a bat-signal to the GM…',
  'Asking Hermione to Accio the missing luggage…',
  'Checking if Gandalf approves the discount code…',
  "Convincing the guest the Wi-Fi isn't cursed…",
  'Summoning the Avengers for a noise complaint…',
  'Arguing with Jarvis about room service…',
  'Waiting on hold with the Ministry of Magic…',
  'Explaining timeshares to a time traveler…',
  'Asking Groot for a one-word status update…',
  'Double-checking with the Oracle…',
  "Rebooting Tony Stark's suit for the minibar…",
  'Reading tea leaves for the checkout time…',
  'Getting Wolverine to fix the AC (aggressively)…',
  'Asking Captain America if this is "the line"…',
  'Bribing the parking valet with cookies…',
  'Consulting a Magic 8-Ball on refund policy…',
  'Waiting for Loki to stop lying about the bill…',
  'Asking Hawkeye to find the missing key card…',
  'Negotiating peace between two feuding guests…',
  'Checking the crystal ball for late checkout…',
  'Almost done, probably, maybe…',
];

function formatMsgTimestamp(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function ChatPage({ user }) {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: `Hi ${user?.name || 'there'}! Ask me about issues, rooms, guests, or department performance.`, at: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setLoadingMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [loading]);

  const callOpenAI = async (chatMessages) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error('AI assistant is not configured (missing OpenAI API key).');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: chatMessages,
        tools: TOOLS,
        tool_choice: 'auto',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'OpenAI request failed');
    return data;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { id: Date.now(), role: 'user', content: text, at: new Date() };
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoadingMsgIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
    setLoading(true);

    try {
      const chatMessages = [
        { role: 'system', content: getSystemPrompt() },
        ...history,
        { role: 'user', content: text },
      ];

      let data = await callOpenAI(chatMessages);
      let choice = data.choices[0];

      if (choice.message.tool_calls?.length) {
        const toolResults = await Promise.all(choice.message.tool_calls.map(async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          let content;
          try {
            content = JSON.stringify(await window.PulseAPI.Chat.callTool(toolCall.function.name, args));
          } catch (err) {
            content = JSON.stringify({ error: err?.message || 'Tool call failed' });
          }
          return { role: 'tool', tool_call_id: toolCall.id, content };
        }));

        data = await callOpenAI([...chatMessages, choice.message, ...toolResults]);
        choice = data.choices[0];
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: choice.message.content || "I couldn't find an answer to that.",
        at: new Date(),
      }]);
    } catch (err) {
      window.toast?.error(err?.message || 'Something went wrong talking to the AI assistant');
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        role: 'assistant',
        content: 'Sorry, I ran into an error processing that. Please try again.',
        at: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeaderC title="AI Assistant" subtitle="Ask about issues, rooms, guests, and departments" sticky={false} />

      <div ref={listRef} className="flex-1 overflow-y-auto px-7 py-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={cxC('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cxC('max-w-[560px] flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
              {m.role === 'assistant' && <AvatarC name="AI" size={26} />}
              <div className={cxC('flex flex-col gap-1', m.role === 'user' && 'items-end')}>
                <CardC className={cxC('px-3.5 py-2.5', m.role === 'user' ? 'bg-accent! text-white! border-none' : m.isError && 'border-danger/30')}>
                  <div className={cxC('text-[13.5px] leading-[1.5] whitespace-pre-line', m.role === 'user' ? 'text-white' : m.isError ? 'text-danger' : 'text-text')}>
                    {m.content}
                  </div>
                </CardC>
                <div className="text-[11px] text-muted-light px-0.5">{formatMsgTimestamp(m.at)}</div>
              </div>
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pl-9">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="px-3 py-1.5 bg-accent/8 hover:bg-accent/14 text-accent rounded-lg text-[12.5px] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start gap-2">
            <AvatarC name="AI" size={26} />
            <CardC className="px-3.5 py-2.5">
              <div className="text-[13px] text-muted">{LOADING_MESSAGES[loadingMsgIndex]}</div>
            </CardC>
          </div>
        )}
      </div>

      <div className="border-t border-black/6 px-7 py-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about issues, rooms, guests, or departments…"
            rows={1}
            disabled={loading}
            className="flex-1 border border-black/10 rounded-lg px-3 py-2.5 text-[13.5px] resize-none outline-none focus:border-accent"
          />
          <ButtonC icon="send" onClick={sendMessage} disabled={!input.trim() || loading}>Send</ButtonC>
        </div>
      </div>
    </div>
  );
}

window.PageChat = ChatPage;
