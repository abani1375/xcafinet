import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import './OtpVerification.css'

type OtpVerificationProps = {
  contact: string
  onContinue: () => void
  embedded?: boolean
}

type OtpPhase = 'input' | 'verifying' | 'success'
type OtpInlineStyle = CSSProperties & {
  '--particle-x': string
  '--particle-y': string
  '--particle-delay': string
}

const DEMO_CODE = '4719'
const FARSI_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const OTP_DIGIT_COUNT = 4
const SUCCESS_PARTICLES = [
  { x: 8, y: 15 },
  { x: 21, y: 37 },
  { x: 1, y: 76 },
  { x: 48, y: -8 },
  { x: 71, y: 0 },
  { x: 84, y: 4 },
  { x: 99, y: 15 },
  { x: 110, y: 43 },
  { x: 107, y: 69 },
  { x: 82, y: 104 },
  { x: 61, y: 99 },
  { x: 22, y: 101 },
  { x: 3, y: 46 },
  { x: -9, y: 40 },
  { x: 49, y: 95 },
  { x: 88, y: 91 },
  { x: 30, y: 23 },
  { x: 92, y: 30 },
]

function normalizeOtp(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(FARSI_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\D/g, '')
    .slice(0, 4)
}

function toFarsiDigits(value: string) {
  return value.replace(/\d/g, (digit) => FARSI_DIGITS[Number(digit)])
}

function maskContact(contact: string) {
  const trimmedContact = contact.trim()
  const atIndex = trimmedContact.indexOf('@')

  if (atIndex > 0) {
    const localPart = trimmedContact.slice(0, atIndex)
    const domain = trimmedContact.slice(atIndex + 1)
    return `${localPart.slice(0, 1)}•••@${domain}`
  }

  const allDigits = trimmedContact
    .replace(/[۰-۹]/g, (digit) => String(FARSI_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\D/g, '')

  if (allDigits.length >= 8) {
    return `${toFarsiDigits(allDigits.slice(0, 4))} ••• ${toFarsiDigits(allDigits.slice(-4))}`
  }

  return allDigits.length ? `••• ${toFarsiDigits(allDigits.slice(-2))}` : '••••'
}

function formatCountdown(seconds: number) {
  return toFarsiDigits(String(seconds))
}

export default function OtpVerification({ contact, onContinue, embedded = false }: OtpVerificationProps) {
  const [phase, setPhase] = useState<OtpPhase>('input')
  const [code, setCode] = useState('')
  const [remaining, setRemaining] = useState(25)
  const [isFocused, setIsFocused] = useState(true)
  const [popIndex, setPopIndex] = useState<number | null>(null)
  const [invalidCode, setInvalidCode] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [status, setStatus] = useState('')
  const [messageVisible, setMessageVisible] = useState(false)
  const [continued, setContinued] = useState(false)
  const phaseRef = useRef<OtpPhase>('input')
  const inputRef = useRef<HTMLInputElement>(null)
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const verificationTimerRef = useRef<number | null>(null)
  const errorTimerRef = useRef<number | null>(null)
  const messageTimerRef = useRef<number | null>(null)
  const popTimerRef = useRef<number | null>(null)
  const continueTimerRef = useRef<number | null>(null)
  const countdownActive = phase !== 'success' && remaining > 0

  const moveToPhase = (nextPhase: OtpPhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }

  const startVerification = (candidate: string) => {
    if (phaseRef.current !== 'input' || candidate.length !== 4) return

    const isCorrect = candidate === DEMO_CODE
    moveToPhase('verifying')
    setInvalidCode(!isCorrect)
    setHasError(false)
    setStatus('')
    setIsFocused(false)
    setMessageVisible(false)
    inputRef.current?.blur()

    verificationTimerRef.current = window.setTimeout(() => {
      if (isCorrect) {
        moveToPhase('success')
        setStatus('')
        return
      }

      moveToPhase('input')
      setCode('')
      setInvalidCode(false)
      setHasError(true)
      setStatus('کد درست نیست. دوباره امتحان کن.')
      setIsFocused(true)
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0)
      errorTimerRef.current = window.setTimeout(() => {
        setHasError(false)
      }, 500)
    }, isCorrect ? 2700 : 1000)
  }

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (phaseRef.current !== 'input') return

    const nextCode = normalizeOtp(event.currentTarget.value)
    setCode(nextCode)
    setHasError(false)
    setStatus('')
    setPopIndex(nextCode.length ? nextCode.length - 1 : null)

    if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current)
    popTimerRef.current = window.setTimeout(() => setPopIndex(null), 300)
    if (nextCode.length === 4) startVerification(nextCode)
  }

  const handleFillDemoCode = () => {
    if (phaseRef.current !== 'input') return

    inputRef.current?.focus({ preventScroll: true })
    setCode(DEMO_CODE)
    setHasError(false)
    setStatus('')
    setMessageVisible(false)
    setPopIndex(3)
    startVerification(DEMO_CODE)
  }

  const handleResend = () => {
    if (phaseRef.current !== 'input' || remaining > 0) return

    setRemaining(25)
    setMessageVisible(true)
    setStatus('کد تأیید دوباره ارسال شد.')
    setIsFocused(true)
    inputRef.current?.focus({ preventScroll: true })
  }

  const handleContinue = () => {
    if (phaseRef.current !== 'success' || continued) return

    setContinued(true)
    continueTimerRef.current = window.setTimeout(onContinue, 700)
  }

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
    messageTimerRef.current = window.setTimeout(() => {
      if (phaseRef.current === 'input') setMessageVisible(true)
    }, 1100)

    return () => {
      if (verificationTimerRef.current !== null) window.clearTimeout(verificationTimerRef.current)
      if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current)
      if (messageTimerRef.current !== null) window.clearTimeout(messageTimerRef.current)
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current)
      if (continueTimerRef.current !== null) window.clearTimeout(continueTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!countdownActive) return

    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [countdownActive])

  useEffect(() => {
    if (phase === 'success') continueButtonRef.current?.focus({ preventScroll: true })
  }, [phase])

  const maskedContact = maskContact(contact)
  const panelClasses = [
    'otp-panel',
    phase === 'verifying' ? 'verifying' : '',
    phase === 'success' ? 'success' : '',
    phase === 'verifying' && invalidCode ? 'invalid-code' : '',
    hasError ? 'error' : '',
    continued ? 'continued' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`otp-verification-page${embedded ? ' otp-verification-embedded' : ''}`} dir="rtl">
      <div className="otp-verification-content">
        <section
          aria-label={phase === 'success' ? 'با موفقیت تأیید شد' : 'تأیید کد یک‌بارمصرف'}
          className={panelClasses}
        >
          <div className="otp-handle" aria-hidden="true" />
          {phase === 'success' && <h2 className="otp-heading">با موفقیت تأیید شد</h2>}
          <p className="otp-subtitle" id="otp-subtitle">
            {phase === 'success' ? (
              'شمارهٔ موبایل شما تأیید شد.'
            ) : (
              <>
                کد ۴ رقمی ارسال‌شده به <bdi className="otp-phone" dir="ltr">{maskedContact}</bdi> را وارد کن.
              </>
            )}
          </p>

          <div className="otp-scene" dir="ltr">
            <div className="otp-orbit" aria-hidden="true" />
            <div className="otp-core" aria-hidden="true" />
            <div className="otp-rotor" aria-hidden="true">
              <div className="otp-digits">
                {Array.from({ length: OTP_DIGIT_COUNT }, (_, index) => {
                  const digitClasses = [
                    'otp-digit',
                    code[index] ? 'filled' : '',
                    isFocused && index === code.length && phase === 'input' ? 'active' : '',
                    popIndex === index ? 'pop' : '',
                  ].filter(Boolean).join(' ')

                  return (
                    <div
                      className={digitClasses}
                      key={index}
                    >
                      <span>{code[index] ?? ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <input
              aria-label="کد تأیید چهاررقمی"
              autoComplete="one-time-code"
              aria-describedby="otp-subtitle otp-status"
              className="otp-code-input"
              dir="ltr"
              inputMode="numeric"
              maxLength={4}
              onBlur={() => setIsFocused(false)}
              onChange={handleCodeChange}
              onFocus={() => setIsFocused(true)}
              pattern="[0-9۰-۹٠-٩]*"
              readOnly={phase !== 'input'}
              ref={inputRef}
              spellCheck={false}
              tabIndex={phase === 'success' ? -1 : 0}
              value={code}
            />
            <div className="otp-success-art" aria-hidden="true">
              <div className="otp-square-ring" />
              <div className="otp-square-ring otp-square-ring-inner" />
              <div className="otp-check-box">
                <svg className="otp-check" viewBox="0 0 32 32" fill="none">
                  <path d="m7 16 6 6 12-13" />
                </svg>
              </div>
              <div className="otp-particles">
                {SUCCESS_PARTICLES.map(({ x, y }, index) => (
                  <i
                    key={index}
                    style={{
                      '--particle-x': `${x}%`,
                      '--particle-y': `${y}%`,
                      '--particle-delay': `${(index % 5) * 0.27}s`,
                      ...(index % 3 === 0 ? { width: '3px', height: '3px', background: '#c5dbd3' } : {}),
                    } as OtpInlineStyle}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="otp-resend-row" aria-hidden={phase === 'success'}>
            <span>کد را دریافت نکردی؟</span>
            <button disabled={remaining > 0 || phase !== 'input'} onClick={handleResend} type="button">
              {remaining > 0 ? `ارسال مجدد تا ${formatCountdown(remaining)} ثانیه` : 'ارسال دوبارهٔ کد'}
            </button>
          </div>

          <p className={`otp-status${status ? ' visible' : ''}`} id="otp-status" role="status" aria-live="polite">
            {status}
          </p>

          <div
            aria-hidden={!messageVisible || phase !== 'input'}
            className={`otp-message${messageVisible && phase === 'input' ? ' show' : ''}`}
          >
            <span className="otp-message-icon" aria-hidden="true">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2 2-6a8 8 0 1 1 16-4Z" />
              </svg>
            </span>
            <span className="otp-message-copy">
              <span className="otp-message-label">MESSAGE · OTP</span>
              کد تأیید شما: <b>{toFarsiDigits(DEMO_CODE)}</b>
            </span>
            <button
              className="otp-fill-button"
              disabled={!messageVisible || phase !== 'input'}
              onClick={handleFillDemoCode}
              tabIndex={messageVisible && phase === 'input' ? 0 : -1}
              type="button"
            >
              درج کد
            </button>
          </div>

          <div className="otp-success-actions" aria-hidden={phase !== 'success'}>
            <span className="otp-secure">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="3" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {continued ? 'آمادهٔ ادامه هستی' : 'تأیید شد، با خیال راحت'}
            </span>
            <button
              className="otp-continue-button"
              onClick={handleContinue}
              ref={continueButtonRef}
              tabIndex={phase === 'success' ? 0 : -1}
              type="button"
            >
              {continued ? 'تأیید شد' : 'ادامه'}
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
