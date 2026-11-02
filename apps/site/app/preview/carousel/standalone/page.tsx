import { PrintCarousel } from "../example/print-carousel";

export default function StandaloneCarousel() {
  return (
    <main
      id="main"
      className="mx-auto my-16 w-[min(720px,calc(100%-32px))] rounded-[22px] bg-white p-6 shadow-(--shadow-raised) sm:p-8"
    >
      <PrintCarousel />
    </main>
  );
}
