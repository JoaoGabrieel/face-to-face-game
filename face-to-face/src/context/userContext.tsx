import { createContext, useContext, useState, type ReactNode } from "react";

interface UserContextType {
  username: string;
  setUsername: (username: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string>(
    () => sessionStorage.getItem("username") || "",
  );

  function setUsername(name: string) {
    sessionStorage.setItem("username", name);
    setUsernameState(name);
  }

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
