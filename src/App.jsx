import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ScenarioProvider } from './context/ScenarioContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; import ScenarioBuilder from './pages/ScenarioBuilder'; import CompareScenarios from './pages/CompareScenarios'; import Weather from './pages/Weather'; import History from './pages/History';
export default function App() { return <ScenarioProvider><BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<Dashboard />} /><Route path="/build" element={<ScenarioBuilder />} /><Route path="/compare" element={<CompareScenarios />} /><Route path="/weather" element={<Weather />} /><Route path="/history" element={<History />} /></Route></Routes></BrowserRouter></ScenarioProvider>; }
