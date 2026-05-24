// ============================================================================
// Mock data — shapes match the real Pulse API responses exactly
// Models: Issue, User, Department, IssueType, IssueCategory, Role, Permission,
//         IssueComment, ActivityLog
// ============================================================================

const PULSE_NOW = new Date("2026-05-20T14:32:00");
const daysAgo = (d) => new Date(PULSE_NOW.getTime() - d * 86400000).toISOString();
const hoursAgo = (h) => new Date(PULSE_NOW.getTime() - h * 3600000).toISOString();
const minsAgo = (m) => new Date(PULSE_NOW.getTime() - m * 60000).toISOString();

// ---- Permissions -----------------------------------------------------------
const PERMISSIONS = [
  "issues.view", "issues.create", "issues.update", "issues.delete",
  "issues.close", "issues.assign", "issues.export.open",
  "reports.view", "reports.monthly", "reports.yearly", "reports.logbook",
  "statistics.view", "graphs.view",
  "admin.users.view", "admin.users.manage",
  "admin.roles.view", "admin.roles.manage",
  "admin.departments.view", "admin.departments.manage",
  "admin.issue-types.view", "admin.issue-types.manage",
].map((name, i) => ({ id: i + 1, name }));

// ---- Roles -----------------------------------------------------------------
const ROLES = [
  { id: 1, name: "SuperAdmin", description: "Full system access", permissions: PERMISSIONS.map(p => p.id), users_count: 1 },
  { id: 2, name: "Duty Manager", description: "Floor operations & issue management", permissions: [1,2,3,5,6,7,8,9,11,12], users_count: 4 },
  { id: 3, name: "Department Head", description: "Department-scoped issue management", permissions: [1,2,3,5,6,8,11], users_count: 6 },
  { id: 4, name: "Staff", description: "Create and view assigned issues", permissions: [1,2], users_count: 14 },
];

// ---- Users -----------------------------------------------------------------
const USERS = [
  { id: 1, name: "Sofia Reyes", email: "sofia.reyes@anvayabali.com", is_active: true, last_login_at: minsAgo(8), roles: [{ id: 2, name: "Duty Manager" }], created_at: daysAgo(220) },
  { id: 2, name: "Marcus Webb", email: "marcus.webb@anvayabali.com", is_active: true, last_login_at: hoursAgo(2), roles: [{ id: 3, name: "Department Head" }], department: "Engineering", created_at: daysAgo(412) },
  { id: 3, name: "Priya Nair", email: "priya.nair@anvayabali.com", is_active: true, last_login_at: hoursAgo(4), roles: [{ id: 3, name: "Department Head" }], department: "F&B", created_at: daysAgo(380) },
  { id: 4, name: "Elena Costa", email: "elena.costa@anvayabali.com", is_active: true, last_login_at: hoursAgo(5), roles: [{ id: 3, name: "Department Head" }], department: "Spa", created_at: daysAgo(290) },
  { id: 5, name: "Henri Lacroix", email: "henri.lacroix@anvayabali.com", is_active: true, last_login_at: hoursAgo(1), roles: [{ id: 3, name: "Department Head" }], department: "Concierge", created_at: daysAgo(510) },
  { id: 6, name: "Anika Patel", email: "anika.patel@anvayabali.com", is_active: true, last_login_at: hoursAgo(3), roles: [{ id: 3, name: "Department Head" }], department: "Housekeeping", created_at: daysAgo(330) },
  { id: 7, name: "Jordan Hayes", email: "jordan.hayes@anvayabali.com", is_active: true, last_login_at: hoursAgo(12), roles: [{ id: 4, name: "Staff" }], department: "Front Office", created_at: daysAgo(150) },
  { id: 8, name: "Theo Andersen", email: "theo.andersen@anvayabali.com", is_active: true, last_login_at: daysAgo(2), roles: [{ id: 4, name: "Staff" }], department: "Engineering", created_at: daysAgo(140) },
  { id: 9, name: "Camille Renaud", email: "camille.renaud@anvayabali.com", is_active: true, last_login_at: hoursAgo(7), roles: [{ id: 4, name: "Staff" }], department: "Housekeeping", created_at: daysAgo(95) },
  { id: 10, name: "Idris Bello", email: "idris.bello@anvayabali.com", is_active: false, last_login_at: daysAgo(45), roles: [{ id: 4, name: "Staff" }], department: "F&B", created_at: daysAgo(220) },
  { id: 11, name: "Mei Lin", email: "mei.lin@anvayabali.com", is_active: true, last_login_at: hoursAgo(18), roles: [{ id: 1, name: "SuperAdmin" }], created_at: daysAgo(900) },
  { id: 12, name: "AK SuperAdmin", email: "ak@ak.ak", is_active: true, last_login_at: minsAgo(5), roles: [{ id: 1, name: "SuperAdmin" }], created_at: daysAgo(365) },
];

const CURRENT_USER = USERS[0]; // Sofia Reyes — Duty Manager

// ---- Departments -----------------------------------------------------------
const DEPARTMENTS = [
  { id: 1, name: "Engineering", code: "ENG", is_active: true, issues_count: 28, open_issues: 8, closed_issues: 20 },
  { id: 2, name: "Housekeeping", code: "HSK", is_active: true, issues_count: 41, open_issues: 6, closed_issues: 35 },
  { id: 3, name: "Food & Beverage", code: "F&B", is_active: true, issues_count: 33, open_issues: 5, closed_issues: 28 },
  { id: 4, name: "Spa & Wellness", code: "SPA", is_active: true, issues_count: 12, open_issues: 2, closed_issues: 10 },
  { id: 5, name: "Concierge", code: "CON", is_active: true, issues_count: 9, open_issues: 1, closed_issues: 8 },
  { id: 6, name: "Front Office", code: "FO",  is_active: true, issues_count: 18, open_issues: 3, closed_issues: 15 },
  { id: 7, name: "Security", code: "SEC", is_active: true, issues_count: 5, open_issues: 0, closed_issues: 5 },
  { id: 8, name: "IT Support", code: "IT", is_active: false, issues_count: 0, open_issues: 0, closed_issues: 0 },
];

// ---- Issue Categories & Types ---------------------------------------------
const ISSUE_CATEGORIES = [
  { id: 1, name: "Maintenance" },
  { id: 2, name: "Cleanliness" },
  { id: 3, name: "Service" },
  { id: 4, name: "Amenity" },
  { id: 5, name: "Billing" },
];

const ISSUE_TYPES = [
  { id: 1, issue_category_id: 1, name: "Air Conditioning", default_severity: "high", is_active: true, issues_count: 14, issue_category: { id: 1, name: "Maintenance" } },
  { id: 2, issue_category_id: 1, name: "Plumbing", default_severity: "high", is_active: true, issues_count: 9, issue_category: { id: 1, name: "Maintenance" } },
  { id: 3, issue_category_id: 1, name: "Electrical", default_severity: "high", is_active: true, issues_count: 6, issue_category: { id: 1, name: "Maintenance" } },
  { id: 4, issue_category_id: 1, name: "TV / Audio", default_severity: "low", is_active: true, issues_count: 4, issue_category: { id: 1, name: "Maintenance" } },
  { id: 5, issue_category_id: 1, name: "Wi-Fi / Internet", default_severity: "medium", is_active: true, issues_count: 7, issue_category: { id: 1, name: "Maintenance" } },
  { id: 6, issue_category_id: 2, name: "Room Cleanliness", default_severity: "medium", is_active: true, issues_count: 11, issue_category: { id: 2, name: "Cleanliness" } },
  { id: 7, issue_category_id: 2, name: "Linen / Towels", default_severity: "medium", is_active: true, issues_count: 8, issue_category: { id: 2, name: "Cleanliness" } },
  { id: 8, issue_category_id: 3, name: "Slow Service", default_severity: "medium", is_active: true, issues_count: 6, issue_category: { id: 3, name: "Service" } },
  { id: 9, issue_category_id: 3, name: "Staff Behavior", default_severity: "high", is_active: true, issues_count: 3, issue_category: { id: 3, name: "Service" } },
  { id: 10, issue_category_id: 3, name: "Noise Disturbance", default_severity: "high", is_active: true, issues_count: 5, issue_category: { id: 3, name: "Service" } },
  { id: 11, issue_category_id: 4, name: "Pillow / Bedding", default_severity: "low", is_active: true, issues_count: 4, issue_category: { id: 4, name: "Amenity" } },
  { id: 12, issue_category_id: 4, name: "Dietary Restrictions", default_severity: "high", is_active: true, issues_count: 2, issue_category: { id: 4, name: "Amenity" } },
  { id: 13, issue_category_id: 5, name: "Folio Dispute", default_severity: "medium", is_active: true, issues_count: 3, issue_category: { id: 5, name: "Billing" } },
];

// ---- Nationalities ---------------------------------------------------------
const NATIONALITIES = [
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
].sort().map((name, i) => ({ id: i + 1, name }));

// ---- Issues ----------------------------------------------------------------
function deptById(id) { return DEPARTMENTS.find(d => d.id === id); }
function typeById(id) { return ISSUE_TYPES.find(t => t.id === id); }
function userById(id) { return USERS.find(u => u.id === id); }

const ISSUES_RAW = [
  {
    id: 2847, title: "Air conditioning not cooling below 24°C in master bedroom",
    description: "Guest reports the master bedroom AC has been struggling overnight. Thermostat set to 19°C, room remains warm and humid. Has been ongoing since check-in but only reported this morning. Engineering technician dispatched.",
    location: "Ocean Villa 12", name: "Mr. Lawrence Chen", room_number: "OV-12",
    checkin_date: "2026-05-17", checkout_date: "2026-05-24", issue_date: "2026-05-20",
    source: "In-person", nationality: "Singaporean", contact: "+65 9123 4567",
    priority: "high", status: "open",
    created_by: 1, assigned_to_user_id: 2, closed_at: null, closed_by_user_id: null,
    issue_type_id: 1,
    created_at: minsAgo(42), updated_at: minsAgo(15),
    departments: [deptById(1)], issueTypes: [typeById(1)],
    createdBy: userById(1), assignedTo: userById(2), closedBy: null,
    recovery: "Late checkout + complimentary breakfast offered", recovery_cost: 0,
  },
  {
    id: 2846, title: "Persistent noise from adjacent suite",
    description: "Guest unable to sleep due to ongoing noise from Suite 807 — children running and loud television past midnight. Second night of disturbance.",
    location: "Suite 805", name: "Ms. Adaeze Okafor", room_number: "805",
    checkin_date: "2026-05-19", checkout_date: "2026-05-22", issue_date: "2026-05-20",
    source: "Phone", nationality: "Nigerian", contact: "+234 803 555 0142",
    priority: "high", status: "open",
    created_by: 1, assigned_to_user_id: null, closed_at: null,
    issue_type_id: 10,
    created_at: minsAgo(18), updated_at: minsAgo(18),
    departments: [deptById(2), deptById(6)], issueTypes: [typeById(10)],
    createdBy: userById(1), assignedTo: null, closedBy: null,
  },
  {
    id: 2845, title: "Room service delayed by 55 minutes",
    description: "Breakfast ordered at 07:10, delivered at 08:05. Guest had a 09:00 meeting and missed it.",
    location: "Room 422", name: "Dr. Hannah Brückner", room_number: "422",
    checkin_date: "2026-05-19", checkout_date: "2026-05-21", issue_date: "2026-05-20",
    source: "App", nationality: "German", contact: "h.bruckner@example.de",
    priority: "medium", status: "closed",
    created_by: 1, assigned_to_user_id: 3, closed_at: hoursAgo(3), closed_by_user_id: 3,
    issue_type_id: 8,
    created_at: hoursAgo(5), updated_at: hoursAgo(3),
    departments: [deptById(3)], issueTypes: [typeById(8)],
    createdBy: userById(1), assignedTo: userById(3), closedBy: userById(3),
    recovery: "Complimentary dinner at La Marée. Personal apology from F&B Manager.",
    recovery_cost: 250000,
  },
  {
    id: 2844, title: "Couples massage double-booked",
    description: "Guests arrived for 11:00 couples massage to find another couple already in the suite.",
    location: "Aurelia Spa — Suite 2", name: "Mr. & Mrs. Yamamoto", room_number: "BV-04",
    checkin_date: "2026-05-18", checkout_date: "2026-05-23", issue_date: "2026-05-20",
    source: "In-person", nationality: "Japanese", contact: "+81 90 5555 1234",
    priority: "urgent", status: "open",
    created_by: 1, assigned_to_user_id: 4, closed_at: null,
    issue_type_id: 9,
    created_at: hoursAgo(2), updated_at: minsAgo(80),
    departments: [deptById(4)], issueTypes: [typeById(9)],
    createdBy: userById(1), assignedTo: userById(4), closedBy: null,
    recovery: "Private spa evening with champagne pre-arranged.",
    recovery_cost: 1500000,
  },
  {
    id: 2843, title: "Smart TV unresponsive — black screen",
    description: "TV in lounge area does not respond to remote or wall switch.",
    location: "Room 1015", name: "Ms. Camille Renaud", room_number: "1015",
    checkin_date: "2026-05-16", checkout_date: "2026-05-20", issue_date: "2026-05-19",
    source: "Phone", nationality: "French", contact: "+33 6 12 34 56 78",
    priority: "low", status: "closed",
    created_by: 1, assigned_to_user_id: 2, closed_at: hoursAgo(19), closed_by_user_id: 2,
    issue_type_id: 4,
    created_at: hoursAgo(20), updated_at: hoursAgo(19),
    departments: [deptById(1)], issueTypes: [typeById(4)],
    createdBy: userById(1), assignedTo: userById(2), closedBy: userById(2),
    recovery: "Firmware reset resolved the issue.",
  },
  {
    id: 2842, title: "Pillow preference not honored",
    description: "Guest requested firm pillows at booking. Soft pillows provided on arrival and after first turndown.",
    location: "Suite 902", name: "Mr. Idris Bello", room_number: "902",
    checkin_date: "2026-05-15", checkout_date: "2026-05-21", issue_date: "2026-05-20",
    source: "App", nationality: "Nigerian", contact: "i.bello@example.com",
    priority: "low", status: "open",
    created_by: 1, assigned_to_user_id: 6, closed_at: null,
    issue_type_id: 11,
    created_at: hoursAgo(8), updated_at: hoursAgo(4),
    departments: [deptById(2)], issueTypes: [typeById(11)],
    createdBy: userById(1), assignedTo: userById(6), closedBy: null,
  },
  {
    id: 2841, title: "Wi-Fi unreliable — drops every 5-10 min",
    description: "Connection drops every 5–10 minutes. Guest is here for work.",
    location: "Room 318", name: "Mrs. Petra Kovač", room_number: "318",
    checkin_date: "2026-05-19", checkout_date: "2026-05-21", issue_date: "2026-05-20",
    source: "In-person", nationality: "Croatian", contact: "p.kovac@example.hr",
    priority: "medium", status: "open",
    created_by: 1, assigned_to_user_id: null, closed_at: null,
    issue_type_id: 5,
    created_at: minsAgo(8), updated_at: minsAgo(8),
    departments: [deptById(1)], issueTypes: [typeById(5)],
    createdBy: userById(1), assignedTo: null, closedBy: null,
  },
  {
    id: 2840, title: "Yacht charter booking error — 6h instead of 12h",
    description: "Concierge booked a 6-hour charter instead of the 12-hour package requested for the guest's anniversary.",
    location: "Concierge Desk", name: "Mr. Theo Andersen", room_number: "GV-08",
    checkin_date: "2026-05-14", checkout_date: "2026-05-24", issue_date: "2026-05-20",
    source: "Phone", nationality: "Danish", contact: "+45 22 33 44 55",
    priority: "high", status: "open",
    created_by: 5, assigned_to_user_id: 5, closed_at: null,
    issue_type_id: 8,
    created_at: hoursAgo(3), updated_at: hoursAgo(2),
    departments: [deptById(5)], issueTypes: [typeById(8)],
    createdBy: userById(5), assignedTo: userById(5), closedBy: null,
  },
  {
    id: 2839, title: "Bathroom not cleaned to standard",
    description: "Hair found on shower wall and floor not mopped. Reported with photos.",
    location: "Room 608", name: "Ms. Valentina Russo", room_number: "608",
    checkin_date: "2026-05-18", checkout_date: "2026-05-21", issue_date: "2026-05-19",
    source: "App", nationality: "Italian", contact: "v.russo@example.it",
    priority: "medium", status: "closed",
    created_by: 1, assigned_to_user_id: 6, closed_at: hoursAgo(13), closed_by_user_id: 6,
    issue_type_id: 6,
    created_at: hoursAgo(14), updated_at: hoursAgo(13),
    departments: [deptById(2)], issueTypes: [typeById(6)],
    createdBy: userById(1), assignedTo: userById(6), closedBy: userById(6),
    recovery: "Deep clean within 35 min. Spa credit USD 75.", recovery_cost: 1125000,
  },
  {
    id: 2838, title: "Halal dietary requirement not flagged to kitchen",
    description: "Guest's halal requirement was on profile but not communicated to in-suite dining.",
    location: "Presidential Suite", name: "Sheikh Khalid Al-Mansour", room_number: "PS-01",
    checkin_date: "2026-05-18", checkout_date: "2026-05-22", issue_date: "2026-05-19",
    source: "In-person", nationality: "Emirati", contact: "+971 50 555 0100",
    priority: "high", status: "closed",
    created_by: 1, assigned_to_user_id: 3, closed_at: hoursAgo(25), closed_by_user_id: 3,
    issue_type_id: 12,
    created_at: hoursAgo(26), updated_at: hoursAgo(25),
    departments: [deptById(3)], issueTypes: [typeById(12)],
    createdBy: userById(1), assignedTo: userById(3), closedBy: userById(3),
    recovery: "Profile flagged property-wide. Personal visit from Executive Chef. Tasting menu offered.",
  },
  {
    id: 2837, title: "Towels not replaced for two days",
    description: "Housekeeping missed towel refresh on consecutive turndowns.",
    location: "Room 511", name: "Mr. James Okonkwo", room_number: "511",
    checkin_date: "2026-05-17", checkout_date: "2026-05-22", issue_date: "2026-05-19",
    source: "Phone", nationality: "Nigerian", contact: "+234 802 555 0190",
    priority: "low", status: "closed",
    created_by: 1, assigned_to_user_id: 6, closed_at: daysAgo(1), closed_by_user_id: 6,
    issue_type_id: 7,
    created_at: daysAgo(2), updated_at: daysAgo(1),
    departments: [deptById(2)], issueTypes: [typeById(7)],
    createdBy: userById(1), assignedTo: userById(6), closedBy: userById(6),
    recovery: "Same-day delivery + housekeeping supervisor follow-up.",
  },
  {
    id: 2836, title: "Folio charged for minibar item not consumed",
    description: "Guest disputes charge for premium spirits item. Reviewing CCTV.",
    location: "Room 707", name: "Ms. Aisha Khan", room_number: "707",
    checkin_date: "2026-05-14", checkout_date: "2026-05-19", issue_date: "2026-05-18",
    source: "In-person", nationality: "Pakistani", contact: "a.khan@example.pk",
    priority: "medium", status: "closed",
    created_by: 7, assigned_to_user_id: 7, closed_at: daysAgo(1), closed_by_user_id: 7,
    issue_type_id: 13,
    created_at: daysAgo(2), updated_at: daysAgo(1),
    departments: [deptById(6)], issueTypes: [typeById(13)],
    createdBy: userById(7), assignedTo: userById(7), closedBy: userById(7),
    recovery: "Charge reversed. Apology issued.",
  },
];

// ---- Issue Comments --------------------------------------------------------
const ISSUE_COMMENTS = {
  2847: [
    { id: 101, issue_id: 2847, body: "Technician dispatched. Likely refrigerant low-charge — bringing replacement unit as backup.", user: userById(2), created_at: minsAgo(20) },
    { id: 102, issue_id: 2847, body: "Called guest. Offered late checkout and complimentary breakfast for inconvenience.", user: userById(1), created_at: minsAgo(15) },
  ],
  2846: [],
  2845: [
    { id: 103, issue_id: 2845, body: "Issued complimentary dinner voucher — Code DIN-4471.", user: userById(3), created_at: hoursAgo(4) },
  ],
  2844: [
    { id: 104, issue_id: 2844, body: "Escalated to GM — VIP guests, critical service failure.", user: userById(1), created_at: minsAgo(95) },
    { id: 105, issue_id: 2844, body: "Met with guests in suite. Offered private spa evening with champagne.", user: userById(4), created_at: minsAgo(80) },
  ],
  2843: [],
  2842: [
    { id: 106, issue_id: 2842, body: "Firm pillows delivered. Preference added to guest profile.", user: userById(6), created_at: hoursAgo(4) },
  ],
};

// ---- Activity Log ----------------------------------------------------------
const ACTIVITY_LOG = [
  { id: 501, description: "Sofia Reyes opened issue #2847", actor: userById(1), subject_type: "issue", subject_id: 2847, created_at: minsAgo(42) },
  { id: 502, description: "Sofia Reyes assigned #2847 to Marcus Webb", actor: userById(1), subject_type: "issue", subject_id: 2847, created_at: minsAgo(38) },
  { id: 503, description: "Marcus Webb commented on #2847", actor: userById(2), subject_type: "issue", subject_id: 2847, created_at: minsAgo(20) },
  { id: 504, description: "Sofia Reyes commented on #2847", actor: userById(1), subject_type: "issue", subject_id: 2847, created_at: minsAgo(15) },
  { id: 505, description: "Night Desk opened issue #2846", actor: userById(7), subject_type: "issue", subject_id: 2846, created_at: minsAgo(18) },
  { id: 506, description: "Priya Nair closed issue #2845", actor: userById(3), subject_type: "issue", subject_id: 2845, created_at: hoursAgo(3) },
  { id: 507, description: "Sofia Reyes escalated #2844 to GM", actor: userById(1), subject_type: "issue", subject_id: 2844, created_at: minsAgo(95) },
  { id: 508, description: "Marcus Webb closed issue #2843", actor: userById(2), subject_type: "issue", subject_id: 2843, created_at: hoursAgo(19) },
];

window.PULSE_MOCK = {
  NOW: PULSE_NOW,
  PERMISSIONS, ROLES, USERS, CURRENT_USER,
  DEPARTMENTS, ISSUE_CATEGORIES, ISSUE_TYPES, NATIONALITIES,
  ISSUES: ISSUES_RAW, ISSUE_COMMENTS, ACTIVITY_LOG,
  getPermissionsForUser(user) {
    if (!user.roles || user.roles.length === 0) return [];
    const allPermissionIds = user.roles.flatMap(role => {
      const roleData = ROLES.find(r => r.id === role.id);
      return roleData ? roleData.permissions : [];
    });
    const uniquePermissionIds = [...new Set(allPermissionIds)];
    return PERMISSIONS.filter(p => uniquePermissionIds.includes(p.id)).map(p => p.name);
  }
};
