import { useParams } from "wouter";
import ConversationDetail from "@/components/ConversationDetail";
import ConversationStarter from "@/components/ConversationStarter";

export default function Conversation() {
  const { id } = useParams();

  return id ? <ConversationDetail id={id} /> : <ConversationStarter />;
}
