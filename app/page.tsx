'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

interface Config {
  current_slots: number
  max_slots: number
  is_active: boolean
}

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null)
  const [step, setStep] = useState<'landing' | 'form' | 'success'>('landing')
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ code: string; name: string; phone: string } | null>(null)

  useEffect(() => {
    fetch('/api/stats-public')
      .then(r => r.json())
      .then(d => setConfig(d.config))
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Preencha todos os campos.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao cadastrar.'); return }
      setResult(data)
      setStep('success')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    if (!result) return
    const msg = encodeURIComponent(
      `Olá! Quero garantir meu cashback da Neon Pizzaria 🍕\n\nNome: ${result.name}\nCódigo: ${result.code}\n\nAguardo o link de pagamento!`
    )
    window.open(`https://wa.me/5512992502843?text=${msg}`, '_blank')
  }

  const slotsLeft = config?.current_slots ?? 0
  const isEsgotado = !config?.is_active || slotsLeft <= 0

  const scrollToForm = () => {
    setStep('form')
    setTimeout(() => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>🔥 Oferta Limitada · Válido até 10/07</span>
          <h1 className={styles.title}>
            Pague <span className={styles.accent}>R$49,90</span><br />
            e ganhe <span className={styles.accent}>R$100</span>
          </h1>
          <p className={styles.subtitle}>
            100% de cashback para usar na Neon Pizzaria.<br />
            <strong>Crédito válido até 10 de julho de 2026.</strong>
          </p>

          {/* Slots */}
          {!isEsgotado && (
            <div className={styles.slotsBox}>
              <span className={styles.slotsAlert}>⚡ Restam apenas</span>
              <span className={styles.slotsNumber}>{slotsLeft}</span>
              <span className={styles.slotsLabel}>{slotsLeft === 1 ? 'vaga' : 'vagas'}!</span>
            </div>
          )}

          {isEsgotado && (
            <div className={styles.slotsBox}>
              <span className={styles.esgotado}>⚠️ Ação esgotada</span>
            </div>
          )}

          {step === 'landing' && !isEsgotado && (
            <>
              <button className={styles.ctaBtn} onClick={scrollToForm}>
                Quero garantir antes que esgote! →
              </button>
              <p className={styles.ctaNote}>Cadastro rápido · Pagamento pelo WhatsApp</p>
            </>
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className={styles.how}>
        <h2 className={styles.sectionTitle}>Como funciona</h2>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <span className={styles.stepIcon}>📝</span>
            <h3>1. Cadastre-se</h3>
            <p>Preencha nome, telefone e e-mail. Leva menos de 1 minuto.</p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepIcon}>💳</span>
            <h3>2. Pague R$49,90</h3>
            <p>Nossa equipe envia o link de pagamento pelo WhatsApp na hora.</p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepIcon}>🍕</span>
            <h3>3. Use R$100 na Neon</h3>
            <p>Venha nos visitar e use seu crédito. Vale para qualquer item do cardápio!</p>
          </div>
        </div>
      </section>

      {/* Formulário */}
      {step === 'form' && (
        <section className={styles.formSection} id="form">
          <div className={styles.formCard}>
            <div className={styles.formBadge}>⚡ {slotsLeft} {slotsLeft === 1 ? 'vaga restante' : 'vagas restantes'}</div>
            <h2 className={styles.formTitle}>Garantir meu cashback</h2>
            <p className={styles.formSubtitle}>Após o cadastro, nossa equipe envia o link de pagamento pelo WhatsApp.</p>

            <div className={styles.field}>
              <label>Nome completo</label>
              <input type="text" placeholder="Seu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Telefone (WhatsApp)</label>
              <input type="tel" placeholder="(12) 99999-9999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>E-mail</label>
              <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Cadastrando...' : '✅ Garantir meu cashback agora'}
            </button>

            <button className={styles.backBtn} onClick={() => setStep('landing')}>← Voltar</button>
          </div>
        </section>
      )}

      {/* Sucesso */}
      {step === 'success' && result && (
        <section className={styles.successSection}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>🎉</div>
            <h2>Cadastro confirmado!</h2>
            <p>Seu código de cashback é:</p>
            <div className={styles.codeBox}>{result.code}</div>
            <p className={styles.successInfo}>
              Clique abaixo para ir ao WhatsApp e receber o link de pagamento.<br />
              Após o pagamento, seu crédito de <strong>R$100</strong> estará garantido!
            </p>
            <button className={styles.whatsappBtn} onClick={handleWhatsApp}>
              💬 Finalizar pelo WhatsApp
            </button>
            <p className={styles.successNote}>Guarde seu código: <strong>{result.code}</strong></p>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <p>© 2026 Neon Pizzaria · Ação limitada a {config?.max_slots ?? 10} participantes · Válido até 10/07/2026</p>
      </footer>
    </main>
  )
}
