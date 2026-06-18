'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './admin.module.css'

interface Action {
  id: string
  code: string
  name: string
  phone: string
  email: string
  status: 'pending' | 'paid' | 'used'
  created_at: string
  paid_at: string | null
  used_at: string | null
}

interface Stats {
  pending: number
  paid: number
  used: number
  total: number
}

interface Config {
  max_slots: number
  current_slots: number
  is_active: boolean
}

const PASSWORD = 'neon2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [actions, setActions] = useState<Action[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'used'>('all')
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/stats?p=${PASSWORD}`)
    const data = await res.json()
    setActions(data.actions)
    setStats(data.stats)
    setConfig(data.config)
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  const handleLogin = () => {
    if (passwordInput === PASSWORD) {
      setAuthed(true)
    } else {
      setPasswordError('Senha incorreta.')
    }
  }

  const handleAction = async (type: 'confirm-payment' | 'use-credit', code: string) => {
    setLoading(true)
    setActionMsg('')
    try {
      const res = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, adminPassword: PASSWORD }),
      })
      const data = await res.json()
      if (!res.ok) { setActionMsg('❌ ' + (data.error || 'Erro')); return }
      setActionMsg('✅ Atualizado com sucesso!')
      fetchData()
    } catch {
      setActionMsg('❌ Erro de conexão.')
    } finally {
      setLoading(false)
      setTimeout(() => setActionMsg(''), 3000)
    }
  }

  const exportCSV = () => {
    const header = ['Código', 'Nome', 'Telefone', 'Email', 'Status', 'Cadastro', 'Pagamento', 'Uso']
    const rows = actions.map(a => [
      a.code, a.name, a.phone, a.email,
      a.status === 'pending' ? 'Aguardando' : a.status === 'paid' ? 'Pago' : 'Crédito Usado',
      new Date(a.created_at).toLocaleString('pt-BR'),
      a.paid_at ? new Date(a.paid_at).toLocaleString('pt-BR') : '-',
      a.used_at ? new Date(a.used_at).toLocaleString('pt-BR') : '-',
    ])
    const csv = [header, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'cashback_neon.csv'; a.click()
  }

  const filtered = actions.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const statusLabel = (s: string) => {
    if (s === 'pending') return { text: 'Aguardando', cls: styles.badgePending }
    if (s === 'paid') return { text: 'Pago ✓', cls: styles.badgePaid }
    return { text: 'Crédito Usado', cls: styles.badgeUsed }
  }

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1>Admin · Neon Cashback</h1>
          <input
            type="password"
            placeholder="Senha"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {passwordError && <p className={styles.error}>{passwordError}</p>}
          <button onClick={handleLogin}>Entrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.admin}>
      <header className={styles.header}>
        <div>
          <h1>Painel Admin · Cashback Neon</h1>
          <p>Ação válida até 10/07/2026</p>
        </div>
        <button className={styles.exportBtn} onClick={exportCSV}>⬇ Exportar CSV</button>
      </header>

      {/* Stats */}
      {stats && config && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{config.current_slots}</span>
            <span className={styles.statLabel}>Vagas restantes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Aguardando pagamento</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.paid}</span>
            <span className={styles.statLabel}>Pagos (crédito ativo)</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.used}</span>
            <span className={styles.statLabel}>Crédito utilizado</span>
          </div>
        </div>
      )}

      {actionMsg && <div className={styles.actionMsg}>{actionMsg}</div>}

      {/* Filtros */}
      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          placeholder="Buscar nome, código ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filterBtns}>
          {(['all', 'pending', 'paid', 'used'] as const).map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Aguardando' : f === 'paid' ? 'Pagos' : 'Usados'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const badge = statusLabel(a.status)
              return (
                <tr key={a.id}>
                  <td><code className={styles.code}>{a.code}</code></td>
                  <td>{a.name}</td>
                  <td>
                    <a
                      href={`https://wa.me/55${a.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.phoneLink}
                    >
                      {a.phone}
                    </a>
                  </td>
                  <td>{a.email}</td>
                  <td><span className={`${styles.badge} ${badge.cls}`}>{badge.text}</span></td>
                  <td>{new Date(a.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className={styles.actionsBtns}>
                    {a.status === 'pending' && (
                      <button
                        className={styles.confirmBtn}
                        disabled={loading}
                        onClick={() => handleAction('confirm-payment', a.code)}
                      >
                        ✓ Confirmar pagamento
                      </button>
                    )}
                    {a.status === 'paid' && (
                      <button
                        className={styles.useBtn}
                        disabled={loading}
                        onClick={() => handleAction('use-credit', a.code)}
                      >
                        🍕 Marcar como usado
                      </button>
                    )}
                    {a.status === 'used' && <span className={styles.doneLabel}>Concluído</span>}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.empty}>Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
