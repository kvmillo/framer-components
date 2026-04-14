// Framer Code Component — Ajax HubSpot Form (Direct API) — Book a Meeting Form
// Portal ID: 23114530 | Form ID: dffb5768-76ae-4357-8350-a3961efd5dc4
//
// ✅ Preloads HubSpot meetings embed in background (warms browser cache)
// ✅ On success (qualified): pops a fixed modal with the calendar, email pre-filled
// ✅ On success (waitlist): redirects as before

import { useState, useEffect } from "react"

const PORTAL_ID = "23114530"
const FORM_ID = "dffb5768-76ae-4357-8350-a3961efd5dc4"
const SESSION_KEY = "ajax_form_params"

// ── Design Tokens ────────────────────────────────────────────
const LABEL_COLOR = "#010E2E"
const INPUT_BG = "#ffffff"
const INPUT_BORDER = "rgba(0,0,0,0.2)"
const INPUT_FOCUS_BORDER = "#3804E6"
const INPUT_RADIUS = 8
const FONT_SIZE = 16
const INPUT_COLOR = "#010E2E"
const PLACEHOLDER_COLOR = "rgba(0,0,0,0.5)"
const BUTTON_COLOR = "#3804E6"
const BUTTON_HOVER_COLOR = "#2D08FF"
const BUTTON_RADIUS = 48
const FIELD_GAP = 24
const LABEL_INPUT_GAP = 12

// ── Scoped CSS — injected into <head> to avoid canvas render artifact ──
const FORM_CLASS = "ajax-hs-form-v2"
const formCSS = `
.${FORM_CLASS} input::placeholder{color:${PLACEHOLDER_COLOR};font-family:'Inter',sans-serif;font-size:${FONT_SIZE}px}
.${FORM_CLASS} input:focus,.${FORM_CLASS} select:focus{outline:none;border-color:${INPUT_FOCUS_BORDER}!important;box-shadow:none!important}
#call{display:none!important}
body.ajax-call-visible #call{display:block!important}
body.ajax-call-visible #form{display:none!important}
`

// ── Free email domains to block ──────────────────────────────
const FREE_EMAIL_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "aol.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com",
    "live.com", "msn.com", "me.com", "mac.com", "inbox.com", "gmx.com",
    "tutanota.com", "fastmail.com", "hey.com", "pm.me",
]

const BILLING_SYSTEMS: { label: string; value: string }[] = [
    { label: "Clio", value: "Clio" },
    { label: "MyCase", value: "MyCase" },
    { label: "PracticePanther", value: "Practice Panther" },
    { label: "SurePoint Finance Enterprise (LMS/Rippe)", value: "SurePoint LMS" },
    { label: "SurePoint Finance Core (Coyote)", value: "SurePoint Coyote" },
    { label: "FileVine", value: "FileVine" },
    { label: "ActionStep", value: "ActionStep" },
    { label: "Smokeball", value: "Smokeball" },
    { label: "Tabs3", value: "Tabs3" },
    { label: "CARET Legal (Zola Suite)", value: "Caret Legal" },
    { label: "Other", value: "Other" },
]

const FIRM_SIZES: { label: string; value: string }[] = [
    { label: "Solo", value: "Solo" },
    { label: "2–5 Timekeepers", value: "Small (1-5 TKs)" },
    { label: "6–12 Timekeepers", value: "Small (5+ TKs)" },
    { label: "13–19 Timekeepers", value: "Small (13-19 TKs)" },
    { label: "20–60 Timekeepers", value: "Medium" },
    { label: "61–200 Timekeepers", value: "Large" },
    { label: "201–500 Timekeepers", value: "201+ TKs" },
    { label: "500+ Timekeepers", value: "AmLaw 200" },
]

// ── Helpers ──────────────────────────────────────────────────
function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
    return match ? decodeURIComponent(match[2]) : ""
}
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function isBlockedEmail(e: string) {
    return FREE_EMAIL_DOMAINS.includes(e.split("@")[1]?.toLowerCase())
}
function captureAndPersistParams(): Record<string, string> {
    const p = new URLSearchParams(window.location.search)
    let stored: Record<string, string> = {}
    try { stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","referral_code","seo_source"]
        .forEach(k => { const v = p.get(k); if (v) stored[k] = v })
    const ref = p.get("ref") || p.get("referral")
    if (ref && !stored["referral_code"]) stored["referral_code"] = ref
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored)) } catch {}
    return stored
}
// ── Component ─────────────────────────────────────────────────
export default function AjaxHubSpotFormV2(_props) {
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [showExtraFields, setShowExtraFields] = useState(false)
    const [phone, setPhone] = useState("")
    const [billingSystem, setBillingSystem] = useState("")
    const [billingOther, setBillingOther] = useState("")
    const [firmSize, setFirmSize] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [submitError, setSubmitError] = useState("")

    useEffect(() => {
        captureAndPersistParams()

        // Inject scoped CSS into <head> to avoid style tag rendering as visible text in Framer canvas
        const id = "ajax-hs-form-v2-styles"
        if (!document.getElementById(id)) {
            const el = document.createElement("style")
            el.id = id
            el.textContent = formCSS
            document.head.appendChild(el)
        }

    }, [])

    const showCallSection = (emailVal: string) => {
        try {
            localStorage.setItem("ajax_last_email", emailVal)
            sessionStorage.setItem("ajax_last_email", emailVal)

            document.body.classList.add("ajax-call-visible")

            // Reload the srcdoc iframe inside #call so the meetings embed
            // reinitializes with correct dimensions (was 0 while hidden)
            setTimeout(() => {
                const callEl = document.getElementById("call")
                if (!callEl) return
                const iframe = callEl.querySelector("iframe") as HTMLIFrameElement | null
                if (iframe && iframe.srcdoc) {
                    const saved = iframe.srcdoc
                    iframe.srcdoc = ""
                    requestAnimationFrame(() => { iframe.srcdoc = saved })
                }
                callEl.scrollIntoView({ behavior: "smooth" })
            }, 50)
        } catch {}
    }

    // ── Email validation ──────────────────────────────────────
    const handleEmailBlur = () => {
        if (!email) return
        if (!isValidEmail(email)) { setEmailError("Please enter a valid email address."); setShowExtraFields(false); return }
        if (isBlockedEmail(email)) { setEmailError(`Please enter a different email address. This form does not accept addresses from ${email.split("@")[1]}.`); setShowExtraFields(false); return }
        setEmailError("")
        setShowExtraFields(true)
    }
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); if (emailError) setEmailError("") }

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!isValidEmail(email)) { setEmailError("Please enter a valid email address."); return }
        if (isBlockedEmail(email)) { setEmailError(`Please enter a different email address. This form does not accept addresses from ${email.split("@")[1]}.`); return }
        if (!billingSystem) { setSubmitError("Please select a billing system."); return }
        if (billingSystem === "Other" && !billingOther) { setSubmitError("Please enter your billing system."); return }
        if (!firmSize) { setSubmitError("Please select your firm size."); return }

        setSubmitError("")
        setStatus("loading")

        let tracked: Record<string, string> = {}
        try { tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
        const hutk = getCookie("hubspotutk")

        const hsFields = [
            { name: "email", value: email },
            { name: "phone", value: phone },
            { name: "practice_management_system", value: billingSystem },
            { name: "what_practice_management_software_do_you_use", value: billingSystem === "Other" ? billingOther : "" },
            { name: "firm_size", value: firmSize },
            { name: "utm_source", value: tracked.utm_source || "" },
            { name: "utm_medium", value: tracked.utm_medium || "" },
            { name: "utm_campaign", value: tracked.utm_campaign || "" },
            { name: "utm_term", value: tracked.utm_term || "" },
            { name: "utm_content", value: tracked.utm_content || "" },
            { name: "referral_code", value: tracked.referral_code || "" },
            { name: "seo_source", value: tracked.seo_source || "" },
        ].filter(f => f.value !== "")

        try {
            // v2 endpoint = same as HubSpot embed script → triggers notifications + workflows
            // Must use no-cors because HubSpot v2 blocks cross-origin reads; request still goes through
            const formData = new URLSearchParams()
            hsFields.forEach(f => { if (f.value) formData.append(f.name, f.value) })
            formData.append("hs_context", JSON.stringify({
                hutk: hutk || undefined,
                pageUri: window.location.href,
                pageName: document.title,
            }))

            await fetch(
                `https://forms.hubspot.com/uploads/form/v2/${PORTAL_ID}/${FORM_ID}`,
                { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formData.toString() }
            )

            // no-cors response is always opaque — can't check status, assume success
            try { sessionStorage.removeItem(SESSION_KEY) } catch {}
            try { localStorage.setItem("ajax_last_email", email); sessionStorage.setItem("ajax_last_email", email) } catch {}

            const QUALIFIED_BILLING = ["Clio","MyCase","SurePoint LMS","SurePoint Coyote","Practice Panther","FileVine"]
            const SMALL_FIRM_SIZES = ["Solo","Small (1-5 TKs)"]
            const isQualifiedBilling = QUALIFIED_BILLING.includes(billingSystem)
            const isSmallFirm = SMALL_FIRM_SIZES.includes(firmSize)

            if (isQualifiedBilling && !isSmallFirm) {
                setStatus("success")
                showCallSection(email)
            } else if (isQualifiedBilling && isSmallFirm) {
                window.location.href = "/express-waitlist"
            } else {
                window.location.href = "/billing-system-waitlist"
            }
        } catch (e) {
            setSubmitError("Network error. Please try again.")
            setStatus("error")
        }
    }

    // ── Styles ────────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "12px 16px", fontSize: FONT_SIZE, lineHeight: "1.5em",
        fontFamily: "'Inter', sans-serif", color: INPUT_COLOR, background: INPUT_BG,
        border: `1px solid ${INPUT_BORDER}`, borderRadius: INPUT_RADIUS,
        outline: "none", boxSizing: "border-box", transition: "border-color 0.15s", appearance: "none" as any,
    }
    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: FONT_SIZE, lineHeight: "1em", fontWeight: 400,
        fontFamily: "'Inter', sans-serif", color: LABEL_COLOR, marginBottom: LABEL_INPUT_GAP,
    }
    const fieldWrap: React.CSSProperties = { marginBottom: FIELD_GAP }
    const DropdownArrow = () => (
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: PLACEHOLDER_COLOR, fontSize: 11 }}>▼</div>
    )
    const buttonBase: React.CSSProperties = {
        width: "100%", padding: "12px 24px",
        background: status === "loading" ? "#888" : BUTTON_COLOR,
        color: "#ffffff", fontSize: FONT_SIZE, fontWeight: 500, lineHeight: "1.5em",
        fontFamily: "'Inter', sans-serif", border: "none", borderRadius: BUTTON_RADIUS,
        cursor: status === "loading" ? "not-allowed" : "pointer",
        transition: "background 0.15s", letterSpacing: "0em", whiteSpace: "nowrap" as any,
    }

    return (
        <div className={FORM_CLASS} style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            {/* ── Form ── */}
            {/* Work Email */}
            <div style={fieldWrap}>
                <label style={labelStyle}>Work Email <span style={{ color: "#e74c3c" }}>*</span></label>
                <input
                    type="email" placeholder="you@company.com" value={email}
                    onChange={handleEmailChange} onBlur={handleEmailBlur}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEmailBlur() }}
                    style={{ ...inputStyle, borderColor: emailError ? "#e74c3c" : INPUT_BORDER }}
                />
                {emailError && <div style={{ color: "#e74c3c", fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{emailError}</div>}
            </div>

            {/* Progressive fields */}
            {showExtraFields && (<>
                {/* Phone */}
                <div style={fieldWrap}>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" placeholder="+1 (555) 000-0000" value={phone}
                        onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                </div>

                {/* Billing System */}
                <div style={fieldWrap}>
                    <label style={labelStyle}>Billing System <span style={{ color: "#e74c3c" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                        <select value={billingSystem} onChange={(e) => setBillingSystem(e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer", paddingRight: 40, color: billingSystem ? INPUT_COLOR : PLACEHOLDER_COLOR }}>
                            <option value="" disabled>Select…</option>
                            {BILLING_SYSTEMS.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <DropdownArrow />
                    </div>
                </div>

                {/* Billing Other */}
                {billingSystem === "Other" && (
                    <div style={fieldWrap}>
                        <label style={labelStyle}>What billing system do you use?</label>
                        <input type="text" placeholder="Enter your billing system…" value={billingOther}
                            onChange={(e) => setBillingOther(e.target.value)} style={inputStyle} />
                    </div>
                )}

                {/* Firm Size */}
                <div style={fieldWrap}>
                    <label style={labelStyle}>How big is your firm? <span style={{ color: "#e74c3c" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                        <select value={firmSize} onChange={(e) => setFirmSize(e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer", paddingRight: 40, color: firmSize ? INPUT_COLOR : PLACEHOLDER_COLOR }}>
                            <option value="" disabled>Select…</option>
                            {FIRM_SIZES.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <DropdownArrow />
                    </div>
                </div>
            </>)}

            {submitError && <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{submitError}</div>}

            <button onClick={handleSubmit} disabled={status === "loading"} style={buttonBase}
                onMouseEnter={(e) => { if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = BUTTON_HOVER_COLOR }}
                onMouseLeave={(e) => { if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = BUTTON_COLOR }}>
                {status === "loading" ? "Submitting…" : "Book a Meeting"}
            </button>
        </div>
    )
}

AjaxHubSpotFormV2.displayName = "Ajax HubSpot Form V2"
