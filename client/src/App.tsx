import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Conversation from "@/pages/conversation";
import Review from "@/pages/review";
import History from "@/pages/history";
import NotFound from "@/pages/not-found";
import { ConversationProvider } from "@/contexts/ConversationContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/conversation" component={Conversation} />
      <Route path="/conversation/:id" component={Review} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConversationProvider>
        <TooltipProvider>
          <Navigation />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ConversationProvider>
    </QueryClientProvider>
  );
}

export default App;
