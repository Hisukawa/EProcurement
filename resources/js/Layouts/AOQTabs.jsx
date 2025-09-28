import NavLink from "@/Components/NavLink";

export default function AOQTabs({ pr }) {
  const tabs = [
    {
      label: "AOQ - As Read",
      routeName: "bac_approver.abstract_of_quotations",
    },
    {
      label: "AOQ - As Calculated",
      routeName: "bac_approver.abstract_of_quotations_calculated",
    },
  ];

  return (
    <div className="w-full mx-auto mb-6">
      <div className="flex bg-white rounded-lg shadow overflow-hidden border border-gray-300">
        {tabs.map((tab) => {
          const href = route(tab.routeName, pr); // 👈 pass the PR ID
          const isActive = route().current(tab.routeName);

          return (
            <NavLink
              key={tab.label}
              href={href}
              active={isActive}
              className={`flex-1 flex items-center justify-center text-center px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors duration-200 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
