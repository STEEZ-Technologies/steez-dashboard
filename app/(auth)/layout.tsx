import { getDictionary, getLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/provider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <I18nProvider dict={dict} locale={locale}>
      {children}
    </I18nProvider>
  );
}
