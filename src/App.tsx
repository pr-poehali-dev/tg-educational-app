
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FolderSetupScreen from "@/components/FolderSetupScreen";
import { useProtocolFolder } from "@/hooks/useProtocolFolder";

const queryClient = new QueryClient();

function AppContent() {
  const { isFirstLaunch, selectFolder, isLoading, error } = useProtocolFolder();

  // Пока проверяем хранилище — ничего не показываем
  if (isFirstLaunch === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Первый запуск — экран выбора папки
  if (isFirstLaunch) {
    return <FolderSetupScreen onSelect={selectFolder} isLoading={isLoading} error={error} />;
  }

  // Основное приложение
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;