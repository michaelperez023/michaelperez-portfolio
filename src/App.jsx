import { StoreProvider } from "./redesign/store";
import TheCut from "./redesign/TheCut";

export default function App() {
  return (
    <StoreProvider>
      <TheCut />
    </StoreProvider>
  );
}
