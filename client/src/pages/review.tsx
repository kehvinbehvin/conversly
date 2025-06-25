import { useParams, useLocation } from "wouter";
import { useEffect } from "react";

export default function Review() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  
  // Redirect to conversation page with the same ID
  useEffect(() => {
    if (id) {
      setLocation(`/conversation/${id}`);
    } else {
      setLocation('/dashboard');
    }
  }, [id, setLocation]);

  return null; // This component now just redirects
}