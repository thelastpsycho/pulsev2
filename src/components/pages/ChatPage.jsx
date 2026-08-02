import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getPulseUI, getPulseLayout } from '../../lib/pulse-globals.js';
import { MiniChart } from '../ui/MiniChart.jsx';
// ============================================================================
// AI Chat Assistant — natural-language queries over issues/rooms/guests/departments.
// OpenAI is called directly from the browser (VITE_OPENAI_API_KEY); tool calls
// are proxied through window.PulseAPI.Chat to the backend's /api/ai/tools/{name}.
// ============================================================================

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
      description: 'Get issue statistics for a time period (totals, open/closed/urgent counts, average resolution time) plus the individual issues in that period, each with its description and recovery action, for narrating what actually happened.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['today', 'yesterday', 'last_week', 'this_week', 'last_month', 'this_month'], description: 'Time period for the summary' },
          start_date: { type: 'string', description: 'Custom start date (YYYY-MM-DD), overrides period' },
          end_date: { type: 'string', description: 'Custom end date (YYYY-MM-DD), overrides period' },
          limit: { type: 'integer', description: 'Max individual issues to return for narration (default 25, max 50)' },
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
  return `You are the GuestPulse Assistant, a helpful hotel operations assistant. You answer questions about issues, rooms, guests, and departments using the tools available to you. Always call a tool when the user asks for data you don't already have. If a tool returns no results, say so plainly rather than guessing.

Today's date is ${today} (${readable}). Use this as "now" for any relative date the user mentions (e.g. "yesterday", "last 3 days", "this week"). When the request matches one of the summary tool's period options (today, yesterday, last_week, this_week, last_month, this_month), use that. Otherwise compute start_date and end_date yourself (YYYY-MM-DD, relative to today's date above) rather than guessing a period or year.

When asked to summarize issues over a period, do NOT just recite the aggregate counts. Use the "issues" array the summary tool returns (each has a date, room, guest name, description, and recovery action) and narrate what actually happened, one short sentence per issue, e.g. "On Jul 31, Mr. Brown reported the air conditioning wasn't working; engineering came to the room and fixed it." Base each sentence only on that issue's description and recovery text — don't invent details. Group naturally if there are many similar issues. Only lead with the raw numbers (total/open/closed/urgent) if the user explicitly asks for stats, or mention them briefly at the end. If "issues_returned" is less than the total issue count, note that you're covering the most recent ones.

When a tool result contains 3 or more comparable numeric values across categories (e.g. issue counts per department, or a priority breakdown), include a chart alongside your short prose answer. Emit it as its own fenced block, exactly: \`\`\`chart on its own line, then a single-line JSON object, then \`\`\` on its own line. Schema: {"type": "bar" | "donut", "title": "short title", "data": [{"label": "Housekeeping", "value": 12}, ...]}. Use "bar" for ranked comparisons and "donut" for share-of-total questions. Do not invent a chart for a single number, a yes/no answer, or a list of individual issues (room-search, guest-search, urgent-issues) — those read better as prose or a narrated list. Never put chart data inside the prose text itself; the chart block is separate from and in addition to your narration.`;
}

const SUGGESTIONS = [
  'Show me the summary last week',
  'What happened to room 3122?',
  'Which department has the most issues?',
  'Show me urgent issues',
];

// Caps how many times the model can chain tool calls in one turn before we
// force a final answer, so a confused model can't loop indefinitely.
const MAX_TOOL_ROUNDS = 5;

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

// Compact overrides so markdown elements fit the chat bubble's type scale
// instead of react-markdown's default block spacing.
const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-accent">{children}</a>,
  code: ({ children }) => <code className="px-1 py-0.5 rounded bg-black/6 text-[12.5px] font-mono">{children}</code>,
  pre: ({ children }) => <pre className="bg-black/6 rounded-lg p-2.5 overflow-x-auto text-[12.5px] font-mono mb-2 last:mb-0">{children}</pre>,
  h1: ({ children }) => <div className="font-semibold text-[14.5px] mb-1">{children}</div>,
  h2: ({ children }) => <div className="font-semibold text-[14px] mb-1">{children}</div>,
  h3: ({ children }) => <div className="font-semibold text-[13.5px] mb-1">{children}</div>,
};

const CHART_BLOCK_RE = /```chart\s*([\s\S]*?)```/;

// Pulls a ```chart {...}``` block (if any) out of the model's reply and
// validates it into a {type, title, data} spec MiniChart can render.
// Returns the reply with the block stripped, plus the parsed chart or null.
function extractChart(content) {
  const match = content.match(CHART_BLOCK_RE);
  if (!match) return { text: content, chart: null };

  const text = content.replace(CHART_BLOCK_RE, '').trim();
  try {
    const parsed = JSON.parse(match[1]);
    const data = Array.isArray(parsed.data)
      ? parsed.data.filter(d => d && typeof d.label === 'string' && Number.isFinite(d.value))
      : [];
    if (!data.length) return { text, chart: null };
    return {
      text,
      chart: {
        type: ['bar', 'donut', 'line'].includes(parsed.type) ? parsed.type : 'bar',
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
        data,
      },
    };
  } catch {
    return { text, chart: null };
  }
}

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
        model: 'gpt-4o-mini',
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

      let workingMessages = chatMessages;
      let data = await callOpenAI(workingMessages);
      let choice = data.choices[0];
      let rounds = 0;

      while (choice.message.tool_calls?.length && rounds < MAX_TOOL_ROUNDS) {
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

        workingMessages = [...workingMessages, choice.message, ...toolResults];
        data = await callOpenAI(workingMessages);
        choice = data.choices[0];
        rounds++;
      }

      const { text: replyText, chart } = extractChart(choice.message.content || "I couldn't find an answer to that.");
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: replyText,
        chart,
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
                  <div className={cxC('text-[13.5px] leading-[1.5]', m.role === 'user' ? 'text-white whitespace-pre-line' : m.isError ? 'text-danger whitespace-pre-line' : 'text-text')}>
                    {m.role === 'assistant' && !m.isError
                      ? <ReactMarkdown components={MARKDOWN_COMPONENTS}>{m.content}</ReactMarkdown>
                      : m.content}
                  </div>
                  {m.chart && <MiniChart type={m.chart.type} title={m.chart.title} data={m.chart.data} />}
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
