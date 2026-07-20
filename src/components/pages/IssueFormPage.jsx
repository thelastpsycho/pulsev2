import { useState, useEffect } from 'react'
import { usePageTitle } from '../../lib/usePageTitle'
// ============================================================================
// Issue Form — Create or edit issues
// All styling via Tailwind classes.
// ============================================================================

// Helper functions to safely access window.Pulse objects
const safePulse = () => {
  if (typeof window !== 'undefined' && window.PulseUI && window.PulseForm && window.PulseOverlay && window.PulseLayout) {
    return {
      UI: window.PulseUI, Form: window.PulseForm, Overlay: window.PulseOverlay, Layout: window.PulseLayout
    };
  }
  return {
    UI: { Icon: () => null, Avatar: () => null, Pill: () => null, PriorityPill: () => null, StatusPill: () => null,
           Button: () => null, IconButton: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null,
           EmptyState: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") },
    Form: { Field: () => null, Input: () => null, Textarea: () => null, Select: () => null, MultiSelect: () => null,
            SearchableSelect: () => null, Checkbox: () => null, Segmented: () => null },
    Overlay: { Modal: () => null, Drawer: () => null, Dropdown: () => null, DropdownItem: () => null,
               DropdownDivider: () => null, ConfirmDialog: () => null },
    Layout: { navigate: () => {}, Link: () => null, PageHeader: () => null, Tabs: () => null }
  };
};

const pulse = safePulse();
const II = pulse.UI.Icon; const AvI = pulse.UI.Avatar; const PI = pulse.UI.Pill; const PrI = pulse.UI.PriorityPill;
const StI = pulse.UI.StatusPill; const BI = pulse.UI.Button; const IBI = pulse.UI.IconButton;
const CI = pulse.UI.Card; const SI = pulse.UI.Skeleton; const EI = pulse.UI.EmptyState;
const TI = pulse.UI.TOKENS; const cxI = pulse.UI.cx || ((...xs) => xs.filter(Boolean).join(" "));
const FI = pulse.Form.Field; const InI = pulse.Form.Input; const TaI = pulse.Form.Textarea; const SeI = pulse.Form.Select;
const MsI = pulse.Form.MultiSelect; const SsI = pulse.Form.SearchableSelect; const CbI = pulse.Form.Checkbox; const SgI = pulse.Form.Segmented;
const MdI = pulse.Overlay.Modal; const DdI = pulse.Overlay.Dropdown;
const DiI = pulse.Overlay.DropdownItem; const DdvI = pulse.Overlay.DropdownDivider; const CnI = pulse.Overlay.ConfirmDialog;
const navI = pulse.Layout.navigate; const LkI = pulse.Layout.Link; const PhI = pulse.Layout.PageHeader; const TbI = pulse.Layout.Tabs;

// ============================================================================
// MAIN — Issue Form (create/edit)
// ============================================================================
function IssueFormPage({ id }) {
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", name: "", room_number: "",
    checkin_date: "", checkout_date: "", issue_date: new Date().toISOString().slice(0,10),
    source: "", nationality: "", contact: "",
    priority: "medium", department_ids: [], issue_type_ids: [],
    assigned_to_user_id: null,
    recovery: "", recovery_cost: "",
  });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isEdit) {
      window.PulseAPI.Issues.get(id).then(r => {
        const i = r.data;
        setForm({
          title: i.title || "", description: i.description || "", location: i.location || "",
          name: i.name || "", room_number: i.room_number || "",
          checkin_date: i.checkin_date || "", checkout_date: i.checkout_date || "",
          issue_date: i.issue_date || "", source: i.source || "In-person",
          nationality: i.nationality || "", contact: i.contact || "",
          priority: i.priority || "medium",
          department_ids: i.departments?.map(d => d.id) || [],
          issue_type_ids: i.issueTypes?.map(t => t.id) || [],
          assigned_to_user_id: i.assigned_to_user_id,
          recovery: i.recovery || "", recovery_cost: i.recovery_cost || "",
        });
        setLoading(false);
      }).catch(err => {
        console.error('Failed to load issue:', err);
        window.toast.error('Failed to load issue');
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  // For new issue form, set title explicitly
  usePageTitle(isEdit ? null : 'New Issue', [isEdit]);

  useEffect(() => {
    Promise.all([
      window.PulseAPI.Departments.list(),
      window.PulseAPI.IssueTypes.list(),
      window.PulseAPI.Users.list()
    ]).then(([deptRes, typesRes, usersRes]) => {
      setDepartments(deptRes.data.filter(d => d.is_active));
      setIssueTypes(typesRes.data.filter(t => t.is_active));
      setUsers(usersRes.data.filter(u => u.is_active));
    }).catch(err => {
      console.error('Failed to load form options:', err);
      window.toast.error('Failed to load form options');
      setDepartments([]);
      setIssueTypes([]);
      setUsers([]);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.priority) errs.priority = "Priority is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSaving(true);
    try {
      if (isEdit) {
        await window.PulseAPI.Issues.update(id, form);
        window.toast.success("Issue updated");
        navI(`/issues/${id}`);
      } else {
        const r = await window.PulseAPI.Issues.create(form);
        window.toast.success("Issue created");
        navI(`/issues/${r.data.id}`);
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8"><SI height={300}/></div>;

  return (
    <div>
      <PhI
        breadcrumb={[
          { label: "Issues", to: "/issues" },
          { label: isEdit ? `Edit #${id}` : "New issue" },
        ]}
        sticky={false}
      />

      <div className="max-w-[880px] px-7 pb-[140px] grid grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0">
          <SectionLabel>Issue</SectionLabel>
          <FI label="Title" required error={errors.title}>
            <InI value={form.title} onChange={v => set("title", v)} placeholder="e.g. AC not cooling in master bedroom" autoFocus/>
          </FI>
          <FI label="Description" hint="What did the guest report? Times, severity, any context.">
            <TaI value={form.description} onChange={v => set("description", v)} rows={5} placeholder="Detailed description…"/>
          </FI>
          <FI label="Recovery / Resolution" hint="What was done to resolve the issue? Compensation offered?">
            <TaI value={form.recovery} onChange={v => set("recovery", v)} rows={4} placeholder="Actions taken, guest compensation, resolution details…"/>
          </FI>
          <FI label="Recovery Cost (IDR)" hint="Optional. Total compensation cost in Indonesian Rupiah.">
            <InI value={form.recovery_cost} onChange={v => set("recovery_cost", v)} type="number" placeholder="0" min="0"/>
          </FI>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Departments" hint="Choose one or more">
              <MsI value={form.department_ids} onChange={v => set("department_ids", v)} options={departments.map(d => ({ value: d.id, label: d.name }))}/>
            </FI>
            <FI label="Issue types">
              <MsI value={form.issue_type_ids} onChange={v => set("issue_type_ids", v)} options={issueTypes.map(t => ({ value: t.id, label: t.name }))}/>
            </FI>
          </div>

          <SectionLabel className="mt-5">Guest details</SectionLabel>
          <FI label="Guest name"><InI value={form.name} onChange={v => set("name", v)} icon="user" placeholder="Mr. / Ms. …"/></FI>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Room / Villa"><InI value={form.room_number} onChange={v => set("room_number", v)} placeholder="e.g. 805 or OV-12"/></FI>
            <FI label="Source"><InI value={form.source} onChange={v => set("source", v)} placeholder="Booking.com, Agoda, etc."/></FI>
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <FI label="Guest Stay" hint="Check-in and check-out dates (optional)">
              <window.RangeDatePicker
                defaultStartDate={form.checkin_date ? new Date(form.checkin_date) : null}
                defaultEndDate={form.checkout_date ? new Date(form.checkout_date) : null}
                onDateChange={(start, end) => {
                  set("checkin_date", start ? start.toISOString().split('T')[0] : "");
                  set("checkout_date", end ? end.toISOString().split('T')[0] : "");
                }}
                placeholder="Select check-in and check-out dates"
              />
            </FI>
            <FI label="Issue date" required><InI value={form.issue_date} onChange={v => set("issue_date", v)} type="date"/></FI>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Nationality">
              <SsI
                value={form.nationality}
                onChange={v => set("nationality", v)}
                placeholder="Select nationality…"
                options={[
                  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian", "Australian", "Austrian",
                  "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese",
                  "Bolivian", "Bosnian", "Botswanan", "Brazilian", "Bruneian", "Bulgarian", "Burkinabe", "Burundian", "Cambodian", "Cameroonian",
                  "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian", "Congolese", "Costa Rican",
                  "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "East Timorese", "Ecuadorean",
                  "Egyptian", "Emirati", "English", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French",
                  "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean", "Guyanese",
                  "Haitian", "Honduran", "Hungarian", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
                  "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kuwaiti", "Kyrgyz", "Laotian",
                  "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian",
                  "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan",
                  "Mongolian", "Moroccan", "Mosotho", "Motswana", "Myanmar", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan",
                  "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Panamanian", "Papua New Guinean", "Paraguayan",
                  "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan",
                  "San Marinese", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian",
                  "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish",
                  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian", "Tunisian",
                  "Turkish", "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan", "Vatican", "Venezuelan",
                  "Vietnamese", "Welsh", "Yemeni", "Zambian", "Zimbabwean"
                ].map(n => ({ value: n, label: n }))}
              />
            </FI>
            <FI label="Contact"><InI value={form.contact} onChange={v => set("contact", v)} icon="phone" placeholder="phone or email"/></FI>
          </div>
        </div>

        <aside>
          <SectionLabel>Routing</SectionLabel>
          <FI label="Priority" required error={errors.priority}>
            <div className="flex flex-col gap-1.5">
              {[
                { v: "urgent", desc: "VIP, safety, major failure" },
                { v: "high",   desc: "Significant impact" },
                { v: "medium", desc: "Standard complaint" },
                { v: "low",    desc: "Minor inconvenience" },
              ].map(o => {
                const meta = window.PulseUI.PRIORITY[o.v];
                const sel = form.priority === o.v;
                return (
                  <button key={o.v} type="button" onClick={() => set("priority", o.v)} className={cxI(
                    "flex items-center gap-2.5 text-left px-3 py-2.5 border font-inherit rounded-xl cursor-pointer transition-all duration-100",
                    sel ? "border-accent bg-accent/10" : "border-black/8 bg-white"
                  )} style={{ borderColor: sel ? meta.color : undefined }}>
                    <div className="w-2 h-2 rounded-full bg-(--priority-color) shrink-0" style={{ background: meta.color }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: sel ? meta.color : TI.text }}>{meta.label}</div>
                      <div className="text-[11.5px] text-muted-light mt-0.5">{o.desc}</div>
                    </div>
                    {sel && <II name="check" size={13} color={meta.color}/>}
                  </button>
                );
              })}
            </div>
          </FI>
          <FI label="Assign to" hint="Optional. Can be set later.">
            <SeI value={form.assigned_to_user_id || ""} onChange={v => set("assigned_to_user_id", v ? Number(v) : null)}
              placeholder="Unassigned"
              options={[{ value: "", label: "Unassigned" }, ...users.map(u => ({ value: u.id, label: u.name }))]}/>
          </FI>
        </aside>
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-black/8 px-7 py-4 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-[880px] mx-auto flex items-center justify-end gap-3">
          <BI variant="ghost" onClick={() => isEdit ? navI(`/issues/${id}`) : navI("/issues")}>Cancel</BI>
          <BI icon={isEdit ? "check" : "plus"} loading={saving} onClick={submit}>{isEdit ? "Save changes" : "Create issue"}</BI>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, className }) {
  return <div className={cxI("text-[11.5px] text-muted-light font-semibold uppercase tracking-wide mb-2.5", className)}>{children}</div>;
}

window.PageIssueForm = IssueFormPage;
