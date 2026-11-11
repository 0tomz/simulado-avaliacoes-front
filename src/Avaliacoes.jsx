import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";
import "./Avaliacoes.css";

const BASE_URL_AVALIACOES = "/api";

// Estados adaptados do formulário antigo para o cenário de artigos
const FORM_VAZIO = { titulo: "", descricao: "", prioridade: "MEDIA" };

function mensagemErro(status, acao) {
  if (status === 401) return "Sessão expirada ou inválida. Faça login novamente.";
  if (status === 403) return "Você não tem permissão para " + acao + " (apenas ADMIN).";
  if (status === 404) return "Artigo não encontrado.";
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

  // Rota alterada para bater em /api/artigos
  async function fetchAvaliacoes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL_AVALIACOES}/artigos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(mensagemErro(res.status, "listar artigos"));
      }

      const data = await res.json();
      setAvaliacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Envio adaptado para bater em /api/artigos enviando titulo, descricao e prioridade
  async function criarAvaliacao(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL_AVALIACOES}/artigos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao,
          prioridade: form.prioridade,
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
        throw new Error(detalhe || mensagemErro(res.status, "cadastrar artigos"));
      }

      setForm(FORM_VAZIO);
      await fetchAvaliacoes();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  // Remoção alterada para bater em /api/artigos/{id}
  async function excluirAvaliacao(id) {
    if (!window.confirm("Deseja realmente excluir este artigo?")) {
      return;
    }
    setError(null);

    try {
      const res = await fetch(`${BASE_URL_AVALIACOES}/artigos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(mensagemErro(res.status, "excluir artigos"));
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
        <h1>Base de Conhecimentos</h1>

        {error && <div className="av-erro">{error}</div>}

        {isAdmin ? (
          <form className="av-form" onSubmit={criarAvaliacao}>
            <h2>Novo Artigo</h2>

            <label>
              Título do Artigo
              <input
                type="text"
                required
                value={form.titulo}
                onChange={(e) => atualizarCampo("titulo", e.target.value)}
              />
            </label>

            <label>
              Descrição do Artigo
              <textarea
                required
                rows="3"
                maxLength="1000"
                value={form.descricao}
                onChange={(e) => atualizarCampo("descricao", e.target.value)}
              />
            </label>

            <label>
              Prioridade
              <select
                value={form.prioridade}
                onChange={(e) => atualizarCampo("prioridade", e.target.value)}
              >
                <option value="BAIXA">BAIXA</option>
                <option value="MEDIA">MÉDIA</option>
                <option value="ALTA">ALTA</option>
              </select>
            </label>

            <button type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : "Cadastrar"}
            </button>
          </form>
        ) : (
          <p className="av-aviso">Somente ADMIN pode cadastrar e excluir artigos.</p>
        )}

        <div className="av-lista-topo">
          <h2>Lista de artigos</h2>
          <button onClick={fetchAvaliacoes} disabled={loading}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="av-vazio">Carregando...</div>
        ) : avaliacoes.length === 0 ? (
          <div className="av-vazio">Nenhum artigo encontrado.</div>
        ) : (
          <ul className="av-lista">
            {avaliacoes.map((a) => (
              <li key={a.id} className="av-item">
                <div className="av-item-topo">
                  <div>
                    <div className="av-pessoas">
                      Artigo: <strong>{a.titulo}</strong>
                    </div>
                    <div className="av-data">
                      Criado por: {a.emailCriador} | {a.dataCriacao ? new Date(a.dataCriacao).toLocaleString("pt-BR") : "-"}
                    </div>
                  </div>
                  <div className="av-lado">
                    <span className={`av-status av-status-ATIVA`}>{a.prioridade}</span>
                  </div>
                </div>
                <p className="av-comentarios">{a.descricao}</p>
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
