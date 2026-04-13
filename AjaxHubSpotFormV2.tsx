// Framer Code Component — Ajax HubSpot Form (Direct API) — Book a Meeting Form
// Portal ID: 23114530 | Form ID: dffb5768-76ae-4357-8350-a3961efd5dc4
//
// ✅ All HubSpot internal field names verified from property screenshots
// ✅ UTMs captured on page load and persisted in sessionStorage
// ✅ referral_code read from URL param (?ref=...)
// ✅ seo_source read from URL param (?seo_source=...)
// ✅ hubspotutk cookie passed for contact association
// ✅ pageUri + pageName sent in context
// ✅ Blocks free email providers
// ✅ Progressive fields after valid email

import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const PORTAL_ID = "23114530"
const FORM_ID = "dffb5768-76ae-4357-8350-a3961efd5dc4"

// ── Session key for UTM persistence ─────────────────────────
const SESSION_KEY = "ajax_form_params"

// ── Free email domains to block ──────────────────────────────
const FREE_EMAIL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "mail.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
    "live.com",
    "msn.com",
    "me.com",
    "mac.com",
    "inbox.com",
    "gmx.com",
    "tutanota.com",
    "fastmail.com",
    "hey.com",
    "pm.me",
]

// ── Billing System: label shown → internal value sent to HubSpot ─
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

// ── Firm Size: label shown → internal value sent to HubSpot ──
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

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isBlockedEmail(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase()
    return FREE_EMAIL_DOMAINS.includes(domain)
}

// Capture all tracking params from URL and persist to sessionStorage.
function captureAndPersistParams(): Record<string, string> {
    const p = new URLSearchParams(window.location.search)

    let stored: Record<string, string> = {}
    try {
        stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}")
    } catch {}

    const keys = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "referral_code",
        "seo_source",
    ]

    keys.forEach((key) => {
        const val = p.get(key)
        if (val) stored[key] = val
    })

    const ref = p.get("ref") || p.get("referral")
    if (ref && !stored["referral_code"]) stored["referral_code"] = ref

    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
    } catch {}

    return stored
}

// ── Component ─────────────────────────────────────────────────
export default function AjaxHubSpotFormV2(props) {
    const {
        labelColor,
        inputBg,
        inputBorderColor,
        inputRadius,
        buttonColor,
        buttonTextColor,
        buttonRadius,
        buttonLabel,
        fontSize,
        fullWidthButton,
    } = props

    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [showExtraFields, setShowExtraFields] = useState(false)
    const [phone, setPhone] = useState("")
    const [billingSystem, setBillingSystem] = useState("")
    const [billingOther, setBillingOther] = useState("")
    const [firmSize, setFirmSize] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [submitError, setSubmitError] = useState("")

    // Capture params on mount
    useEffect(() => {
        captureAndPersistParams()
    }, [])

    // ── Email validation ─────────────────────────────────────
    const handleEmailBlur = () => {
        if (!email) return
        if (!isValidEmail(email)) {
            setEmailError("Please enter a valid email address.")
            setShowExtraFields(false)
            return
        }
        if (isBlockedEmail(email)) {
            setEmailError(
                `Please enter a different email address. This form does not accept addresses from ${email.split("@")[1]}.`
            )
            setShowExtraFields(false)
            return
        }
        setEmailError("")
        setShowExtraFields(true)
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
        if (emailError) setEmailError("")
    }

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!isValidEmail(email)) {
            setEmailError("Please enter a valid email address.")
            return
        }
        if (isBlockedEmail(email)) {
            setEmailError(
                `Please enter a different email address. This form does not accept addresses from ${email.split("@")[1]}.`
            )
            return
        }
        if (!billingSystem) {
            setSubmitError("Please select a billing system.")
            return
        }
        if (billingSystem === "Other" && !billingOther) {
            setSubmitError("Please enter your billing system.")
            return
        }
        if (!firmSize) {
            setSubmitError("Please select your firm size.")
            return
        }

        setSubmitError("")
        setStatus("loading")

        let tracked: Record<string, string> = {}
        try {
            tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}")
        } catch {}

        const hutk = getCookie("hubspotutk")

        const hsFields = [
            { name: "email", value: email },
            { name: "phone", value: phone },
            { name: "practice_management_system", value: billingSystem },
            {
                name: "what_practice_management_software_do_you_use",
                value: billingSystem === "Other" ? billingOther : "",
            },
            { name: "firm_size", value: firmSize },
            { name: "utm_source", value: tracked.utm_source || "" },
            { name: "utm_medium", value: tracked.utm_medium || "" },
            { name: "utm_campaign", value: tracked.utm_campaign || "" },
            { name: "utm_term", value: tracked.utm_term || "" },
            { name: "utm_content", value: tracked.utm_content || "" },
            { name: "referral_code", value: tracked.referral_code || "" },
            { name: "seo_source", value: tracked.seo_source || "" },
        ].filter((f) => f.value !== "")

        const payload: any = {
            fields: hsFields,
            context: {
                pageUri: window.location.href,
                pageName: document.title,
                ...(hutk ? { hutk } : {}),
            },
        }

        try {
            const res = await fetch(
                `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            )
            if (res.ok) {
                try {
                    sessionStorage.removeItem(SESSION_KEY)
                } catch {}

                // ── Redirect routing logic ──────────────────────────────
                const QUALIFIED_BILLING = [
                    "Clio",
                    "MyCase",
                    "SurePoint LMS",
                    "SurePoint Coyote",
                    "Practice Panther",
                    "FileVine",
                ]
                const SMALL_FIRM_SIZES = ["Solo", "Small (1-5 TKs)"]

                const isQualifiedBilling = QUALIFIED_BILLING.includes(billingSystem)
                const isSmallFirm = SMALL_FIRM_SIZES.includes(firmSize)

                let destination: string
                if (isQualifiedBilling && !isSmallFirm) {
                    destination = "https://joinajax.com/book-a-demo"
                } else if (isQualifiedBilling && isSmallFirm) {
                    destination = "https://joinajax.com/express-waitlist"
                } else {
                    destination = "https://joinajax.com/billing-system-waitlist"
                }

                try {
                    localStorage.setItem("ajax_last_email", email)
                    sessionStorage.setItem("ajax_last_email", email)
                } catch (e) {}

                window.location.href = destination
            } else {
                const data = await res.json()
                setSubmitError(
                    data?.errors?.[0]?.message || "Submission failed. Please try again."
                )
                setStatus("error")
            }
        } catch (e) {
            setSubmitError("Network error. Please try again.")
            setStatus("error")
        }
    }

    // ── Styles ───────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px",
        fontSize,
        background: inputBg,
        border: `1.5px solid ${inputBorderColor}`,
        borderRadius: inputRadius,
        outline: "none",
        color: "#1a1a1a",
        boxSizing: "border-box",
        fontFamily: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s",
        appearance: "none" as any,
    }

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: fontSize - 1,
        fontWeight: 500,
        color: labelColor,
        marginBottom: 8,
        fontFamily: "inherit",
        opacity: 0.85,
    }

    const fieldWrap: React.CSSProperties = { marginBottom: 20 }

    const onFocus = (e: any) => {
        e.target.style.borderColor = buttonColor
        e.target.style.boxShadow = `0 0 0 3px ${buttonColor}33`
    }
    const onBlurInput = (e: any) => {
        e.target.style.borderColor = inputBorderColor
        e.target.style.boxShadow = "none"
    }

    const DropdownArrow = () => (
        <div
            style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#666",
                fontSize: 11,
            }}
        >
            ▼
        </div>
    )

    return (
        <div style={{ width: "100%", fontFamily: "inherit" }}>
            {/* Work Email */}
            <div style={fieldWrap}>
                <label style={labelStyle}>
                    Work Email
                    <span style={{ color: "#e74c3c", marginLeft: 2 }}>*</span>
                </label>
                <input
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleEmailBlur()
                    }}
                    style={{
                        ...inputStyle,
                        borderColor: emailError ? "#e74c3c" : inputBorderColor,
                        background: emailError ? "#fff0f0" : inputBg,
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = emailError ? "#e74c3c" : buttonColor
                        e.target.style.boxShadow = `0 0 0 3px ${emailError ? "#e74c3c" : buttonColor}33`
                    }}
                />
                {emailError && (
                    <div
                        style={{
                            color: "#e74c3c",
                            fontSize: fontSize - 2,
                            marginTop: 6,
                            lineHeight: 1.5,
                        }}
                    >
                        {emailError}
                    </div>
                )}
            </div>

            {/* Progressive fields — shown after valid work email */}
            {showExtraFields && (
                <>
                    {/* Phone Number → phone */}
                    <div style={fieldWrap}>
                        <label style={labelStyle}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder=""
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onFocus={onFocus}
                            onBlur={onBlurInput}
                            style={inputStyle}
                        />
                    </div>

                    {/* Billing System → practice_management_system */}
                    <div style={fieldWrap}>
                        <label style={labelStyle}>
                            Billing System
                            <span style={{ color: "#e74c3c", marginLeft: 2 }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={billingSystem}
                                onChange={(e) => setBillingSystem(e.target.value)}
                                onFocus={onFocus}
                                onBlur={onBlurInput}
                                style={{
                                    ...inputStyle,
                                    cursor: "pointer",
                                    paddingRight: 40,
                                }}
                            >
                                <option value="" disabled>
                                    Select…
                                </option>
                                {BILLING_SYSTEMS.map(({ label, value }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <DropdownArrow />
                        </div>
                    </div>

                    {/* Conditional → what_practice_management_software_do_you_use */}
                    {billingSystem === "Other" && (
                        <div style={fieldWrap}>
                            <label style={labelStyle}>
                                What billing system do you use?
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your billing system…"
                                value={billingOther}
                                onChange={(e) => setBillingOther(e.target.value)}
                                onFocus={onFocus}
                                onBlur={onBlurInput}
                                style={inputStyle}
                            />
                        </div>
                    )}

                    {/* Firm Size → firm_size */}
                    <div style={fieldWrap}>
                        <label style={labelStyle}>
                            How big is your firm?
                            <span style={{ color: "#e74c3c", marginLeft: 2 }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={firmSize}
                                onChange={(e) => setFirmSize(e.target.value)}
                                onFocus={onFocus}
                                onBlur={onBlurInput}
                                style={{
                                    ...inputStyle,
                                    cursor: "pointer",
                                    paddingRight: 40,
                                }}
                            >
                                <option value="" disabled>
                                    Select…
                                </option>
                                {FIRM_SIZES.map(({ label, value }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <DropdownArrow />
                        </div>
                    </div>
                </>
            )}

            {/* Submit error */}
            {submitError && (
                <div
                    style={{
                        color: "#e74c3c",
                        fontSize: fontSize - 2,
                        marginBottom: 12,
                    }}
                >
                    {submitError}
                </div>
            )}

            {/* Button */}
            <div
                style={{
                    display: "flex",
                    justifyContent: fullWidthButton ? "stretch" : "flex-end",
                }}
            >
                <button
                    onClick={handleSubmit}
                    disabled={status === "loading"}
                    style={{
                        width: fullWidthButton ? "100%" : "auto",
                        padding: "14px 32px",
                        background: status === "loading" ? "#888" : buttonColor,
                        color: buttonTextColor,
                        fontSize,
                        fontWeight: 700,
                        border: "none",
                        borderRadius: buttonRadius,
                        cursor: status === "loading" ? "not-allowed" : "pointer",
                        transition: "opacity 0.15s, transform 0.1s",
                        fontFamily: "inherit",
                        letterSpacing: "0.01em",
                        whiteSpace: "nowrap" as any,
                    }}
                    onMouseEnter={(e) => {
                        if (status !== "loading") {
                            ;(e.target as HTMLButtonElement).style.opacity = "0.88"
                            ;(e.target as HTMLButtonElement).style.transform = "translateY(-1px)"
                        }
                    }}
                    onMouseLeave={(e) => {
                        ;(e.target as HTMLButtonElement).style.opacity = "1"
                        ;(e.target as HTMLButtonElement).style.transform = "translateY(0)"
                    }}
                >
                    {status === "loading" ? "Submitting…" : buttonLabel}
                </button>
            </div>
        </div>
    )
}

AjaxHubSpotFormV2.displayName = "Ajax HubSpot Form V2"

addPropertyControls(AjaxHubSpotFormV2, {
    buttonLabel: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Book a Meeting",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#6B4EFF",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#ffffff",
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
    },
    fullWidthButton: {
        type: ControlType.Boolean,
        title: "Full Width Button",
        defaultValue: false,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#aaaaaa",
    },
    inputBg: {
        type: ControlType.Color,
        title: "Input Background",
        defaultValue: "#ffffff",
    },
    inputBorderColor: {
        type: ControlType.Color,
        title: "Input Border",
        defaultValue: "transparent",
    },
    inputRadius: {
        type: ControlType.Number,
        title: "Input Radius",
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 15,
        min: 12,
        max: 20,
        step: 1,
    },
})
