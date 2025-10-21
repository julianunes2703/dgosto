// src/components/DashboardLayout.jsx
import React from "react";
import { useDREData } from "../../hooks/useDREData";     // hook parametrizado (csvUrl)
import { DRE_URL, COMP_URL} from "../../constants";      // defina seus links aqui
import DREDashboard from "../DRE/DREDashboard";
import DRECompetencia from "../Competencia/CompetenciaDashboard";
import CompareDRECompetencia from "../DRExCompetencia/CompareDRECompetencia";
import "./DashboardLayout.css";
import ComercialExplorer from "../../Comercial/ComercialExplorer";
import ProducaoCustoProduto from "../../Producao/ProducaoExplore";

export default function DashboardLayout() {
  // carrega DRE e Competência de URLs diferentes
  const dre  = useDREData(DRE_URL);
  const comp = useDREData(COMP_URL);

  // menu
  const [selectedMenu, setSelectedMenu] = React.useState("dre");

  // meses em comum p/ sincronizar os dois módulos
  const commonMonths = React.useMemo(() => {
    if (!dre.months?.length) return [];
    if (!comp.months?.length) return dre.months;
    return dre.months.filter((m) => comp.months.includes(m));
  }, [dre.months, comp.months]);

  // mês selecionado (compartilhado)
  const [mes, setMes] = React.useState(null);
  React.useEffect(() => {
    const base = (commonMonths.length ? commonMonths : dre.months) || [];
    if (base.length) setMes((prev) => (base.includes(prev) ? prev : base[base.length - 1]));
  }, [dre.months, comp.months, commonMonths]);

  // estados de carregamento/erro
  if (dre.loading || comp.loading) return <main className="dashboard-content">Carregando…</main>;
  if (dre.error)  return <main className="dashboard-content">Erro DRE: {String(dre.error)}</main>;
  if (comp.error) return <main className="dashboard-content">Erro Competência: {String(comp.error)}</main>;

  const renderContent = () => {
    switch (selectedMenu) {
      case "dre":
        return (
          <DREDashboard
            data={dre}
            mes={mes}
            setMes={setMes}
            monthOptions={commonMonths.length ? commonMonths : dre.months}
          />
        );
      case "competencia":
        return <DRECompetencia data={comp} mes={mes} />;

        case "DRExCompetencia":
          return <CompareDRECompetencia dre={dre} comp={comp} mes={mes} />

          case "Comercial":
            return <ComercialExplorer/>

            case "Producao":
              return <ProducaoCustoProduto/>

      default:
        return (
          <DREDashboard
            data={dre}
            mes={mes}
            setMes={setMes}
            monthOptions={commonMonths.length ? commonMonths : dre.months}
          />
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>DGosto</h2>
          <h3 className="blue">By Consulting Blue</h3>
        </div>

        <nav>
          <ul>
            <li className="submenu-title"> Financeiro</li>

            <li
              className={selectedMenu === "dre" ? "active" : ""}
              onClick={() => setSelectedMenu("dre")}
            >
              • DRE
            </li>

            <li
              className={selectedMenu === "competencia" ? "active" : ""}
              onClick={() => setSelectedMenu("competencia")}
            >
              • Competência
            </li>

            <li 
            className={selectedMenu == "DRExCompetencia" ? "active" : ""}
            onClick={() => setSelectedMenu("DRExCompetencia")}
            >
             • DRE x Competência
            </li>

             <li className="submenu-title">Comercial</li>

             
            <li 
            className={selectedMenu == "Comercial" ? "active" : ""}
            onClick={() => setSelectedMenu("Comercial")}
            >
             • Comercial
            </li>

            <li className="submenu-title">Produção</li>

             
            <li 
            className={selectedMenu == "Producao" ? "active" : ""}
            onClick={() => setSelectedMenu("Producao")}
            >
             • Produção
            </li>
          </ul>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="dashboard-content">{renderContent()}</main>
    </div>
  );
}
