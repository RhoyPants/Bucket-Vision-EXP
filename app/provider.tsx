"use client";

import { Provider } from "react-redux";
import { store } from "@/app/redux/store";
import SessionInitializer from "@/app/components/SessionInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}
