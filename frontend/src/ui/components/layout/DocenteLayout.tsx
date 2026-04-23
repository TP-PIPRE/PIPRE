import type { ReactNode } from "react";
import { HeaderDocente } from "../common/HeaderDocente";

export const DocenteLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <HeaderDocente />
      {children}
    </>
  );
};
