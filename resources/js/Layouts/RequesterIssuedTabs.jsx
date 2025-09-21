import NavLink from "@/Components/NavLink";

export default function RequesterIssuedTabs() {
  const tabs = [
    { label: "Requisition and Issue Slips", routeName: "requester.ris_issued" },
    { label: "Inventory Custodian Slips - LOW", routeName: "requester.ics_issued_low" },
    { label: "Inventory Custodian Slips - HIGH", routeName: "requester.ics_issued_high" },
    { label: "Property Acknowledgement Receipt", routeName: "requester.par_issued" },
  ];

  return (
    <div className="w-full mx-auto mb-6">
      <div className="flex bg-white rounded-lg shadow overflow-hidden border border-gray-300 divide-x divide-gray-300">
        {tabs.map((tab) => {
          const isActive = route().current(tab.routeName);
          return (
            <NavLink
              key={tab.label}
              href={route(tab.routeName)}
              active={isActive}
              className={`flex-1 flex items-center justify-center text-center px-4 py-4 text-sm font-medium uppercase tracking-wide transition duration-200 ${
                isActive
                  ? "bg-blue-600 text-white border-b-4 border-gray-600"
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
