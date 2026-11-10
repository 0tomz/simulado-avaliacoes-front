import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";
import "./Avaliacoes.css";

const BASE_URL_AVALIACOES = "/api";

const STATUS = ["ATIVA", "ARQUIVADA", "CANCELADA"];

const FORM_VAZIO = { emailAvaliado: "", nota: "", comentarios: "", status: "ATIVA" };

function mensagemErro(status, acao) {
  if (status === 401) return "Sessão expirada ou inválida. Faça login novamente.";
  if (status === 403) return "Você não tem permissão para " + acao + " (apenas ADMIN).";
  if (status === 404) return "Avaliação não encontrada.";
  if (status === 400) return "Dados inválidos. Confira os campos e tente novamente.";
  return "Erro inesperado (" + status + ").";
}

export default function Avaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);

  const {
    user,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();

  useEffect(() => {
    const fetchTokenAndRoles = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);

        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const roles = payload["https://social-insper.com/roles"] || [];
        setIsAdmin(roles.includes("ADMIN"));
      } catch (e) {
        console.error("Erro ao buscar token:", e);
      }
    };

    if (isAuthenticated) {
      fetchTokenAndRoles();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (token) {
      fetchAvaliacoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);


  if (!isAuthenticated) {
    return <LoginButton />;
  }

  async function fetchAvaliacoes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL_AVALIACOES}/avaliacoes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(mensagemErro(res.status, "listar avaliações"));
      }

      const data = await res.json();
      setAvaliacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function criarAvaliacao(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL_AVALIACOES}/avaliacoes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailAvaliado: form.emailAvaliado,
          comentarios: form.comentarios,
          nota: form.nota === "" ? null : Number(form.nota),
          status: form.status,
        }),
      });

      if (!res.ok) {
        let detalhe = "";
        if (res.status === 400) {
          try {
            detalhe = (await res.json()).erro || "";
          } catch {
            detalhe = "";
          }
        }
        throw new Error(detalhe || mensagemErro(res.status, "cadastrar avaliações"));
      }

      setForm(FORM_VAZIO);
      await fetchAvaliacoes();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function excluirAvaliacao(id) {
    if (!window.confirm("Deseja realmente excluir esta avaliação?")) {
      return;
    }
    setError(null);

    try {
      const res = await fetch(`${BASE_URL_AVALIACOES}/avaliacoes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(mensagemErro(res.status, "excluir avaliações"));
      }

      await fetchAvaliacoes();
    } catch (err) {
      setError(err.message);
    }
  }

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  return (
    <div className="av-page">

      <header className="av-user">
        <img src={user.picture} alt={user.name} />
        <div className="av-user-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <span className={isAdmin ? "av-badge av-badge-admin" : "av-badge av-badge-user"}>
          {isAdmin ? "ADMIN" : "USER"}
        </span>
        <LogoutButton />
      </header>

      <main className="av-card">
        <h1>Avaliações</h1>

        {error && <div className="av-erro">{error}</div>}

        {isAdmin ? (
          <form className="av-form" onSubmit={criarAvaliacao}>
            <h2>Nova avaliação</h2>

            <label>
              Email do avaliado
              <input
                type="email"
                required
                value={form.emailAvaliado}
                onChange={(e) => atualizarCampo("emailAvaliado", e.target.value)}
              />
            </label>

            <label>
              Nota (0 a 10)
              <input
                type="number"
                min="0"
                max="10"
                required
                value={form.nota}
                onChange={(e) => atualizarCampo("nota", e.target.value)}
              />
            </label>

            <label>
              Comentários
              <textarea
                required
                rows="3"
                maxLength="1000"
                value={form.comentarios}
                onChange={(e) => atualizarCampo("comentarios", e.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => atualizarCampo("status", e.target.value)}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : "Cadastrar"}
            </button>
          </form>
        ) : (
          <p className="av-aviso">Somente ADMIN pode cadastrar e excluir avaliações.</p>
        )}

        <div className="av-lista-topo">
          <h2>Lista de avaliações</h2>
          <button onClick={fetchAvaliacoes} disabled={loading}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="av-vazio">Carregando...</div>
        ) : avaliacoes.length === 0 ? (
          <div className="av-vazio">Nenhuma avaliação encontrada.</div>
        ) : (
          <ul className="av-lista">
            {avaliacoes.map((a) => (
              <li key={a.id} className="av-item">
                <div className="av-item-topo">
                  <div>
                    <div className="av-pessoas">
                      <strong>{a.emailAvaliador}</strong> avaliou <strong>{a.emailAvaliado}</strong>
                    </div>
                    <div className="av-data">
                      {a.dataAvaliacao ? new Date(a.dataAvaliacao).toLocaleString("pt-BR") : "-"}
                    </div>
                  </div>
                  <div className="av-lado">
                    <span className="av-nota">{a.nota}</span>
                    <span className={`av-status av-status-${a.status}`}>{a.status}</span>
                  </div>
                </div>
                <p className="av-comentarios">{a.comentarios}</p>
                {isAdmin && (
                  <button
                    className="av-excluir"
                    onClick={() => excluirAvaliacao(a.id)}
                  >
                    Excluir
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

    </div>
  );
}
