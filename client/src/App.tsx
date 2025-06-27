import { Switch, Route } from "wouter";
import { lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import ScrollToTop from "@/components/ScrollToTop";
import Landing from "@/pages/landing";
// import Dashboard from "@/pages/dashboard";
// import Conversation from "@/pages/conversation";
// import Review from "@/pages/review";
// import History from "@/pages/history";
// import NotFound from "@/pages/not-found";
import { ConversationProvider } from "@/contexts/ConversationContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      {/* Commented out other pages - only landing page visible */}
      {/* <Route path="/dashboard" component={Dashboard} /> */}
      {/* <Route path="/conversation" component={Conversation} /> */}
      {/* <Route path="/conversation/:id" component={Conversation} /> */}
      {/* <Route path="/review/:id" component={Review} /> */}
      {/* <Route path="/history" component={History} /> */}
      {/* <Route path="/storage" component={lazy(() => import("./pages/storage"))} /> */}
      {/* <Route component={NotFound} /> */}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConversationProvider
        onError={(error) => {
          console.error("Conversation error:", error);
        }}
      >
        <TooltipProvider>
          <ScrollToTop />
          <Navigation />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ConversationProvider>
    </QueryClientProvider>
  );
}

export default App;
