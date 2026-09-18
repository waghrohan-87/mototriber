import { createContext, useContext, useState, ReactNode } from "react";
import { Rider } from "@/components/riders/RiderCard";

export const INITIAL_RIDERS: Rider[] = [
  {
    id: "1",
    name: "Arjun Mehta",
    handle: "@arjunrides",
    city: "Bangalore",
    category: "RE riders",
    avatarTint: "orange",
    bikes: ["RE Himalayan 450"],
    totalRides: 24,
    attendanceRate: 92,
    ridesOrganised: 12,
    organiserAvgAttendance: 88,
    organiserAvgFillRate: 91,
    kmRidden: 7850,
    connections: 512,
    clubs: 3,
    connected: true,
    ridingInterests: ["Weekend rides", "Long distance touring", "Night rides"],
    rides: [
      { id: "r1", title: "Nandi Hills Sunrise Ride", date: "Sat, Sep 20", distance: "120 km", visibility: "public" },
      { id: "r2", title: "Chikmagalur Endurance Ride", date: "Sat, Sep 27", distance: "320 km", visibility: "public" },
    ],
  },
  {
    id: "2",
    name: "Priya Nair",
    handle: "@priyaonwheels",
    city: "Bangalore",
    category: "Women riders",
    avatarTint: "purple",
    bikes: ["KTM 390 Adventure"],
    totalRides: 18,
    attendanceRate: 100,
    ridesOrganised: 4,
    organiserAvgAttendance: 78,
    organiserAvgFillRate: 70,
    kmRidden: 5120,
    connections: 288,
    clubs: 1,
    connected: false,
    ridingInterests: ["Weekend rides"],
    rides: [
      { id: "r3", title: "Mysore Road Twisties", date: "Sun, Sep 21", distance: "180 km", visibility: "public" },
    ],
  },
  {
    id: "3",
    name: "Karthik Suresh",
    handle: "@karthik_touring",
    city: "Bangalore",
    category: "Touring",
    avatarTint: "blue",
    bikes: ["Kawasaki Versys 650", "RE Interceptor 650"],
    totalRides: 31,
    attendanceRate: 84,
    ridesOrganised: 28,
    organiserAvgAttendance: 92,
    organiserAvgFillRate: 94,
    kmRidden: 14200,
    connections: 940,
    clubs: 4,
    connected: false,
    ridingInterests: ["Long distance touring", "Night rides"],
    rides: [
      { id: "r4", title: "Chikmagalur Endurance Ride", date: "Sat, Sep 27", distance: "320 km", visibility: "public" },
    ],
  },
  {
    id: "4",
    name: "Sneha Iyer",
    handle: "@snehaadv",
    city: "Bangalore",
    category: "Adventure",
    avatarTint: "green",
    bikes: ["BMW G 310 GS"],
    totalRides: 12,
    attendanceRate: 83,
    ridesOrganised: 1,
    organiserAvgAttendance: 0,
    organiserAvgFillRate: 0,
    kmRidden: 3400,
    connections: 176,
    clubs: 1,
    connected: true,
    ridingInterests: ["Weekend rides", "Night rides"],
    rides: [
      { id: "r5", title: "Nandi Hills Sunrise Ride", date: "Sat, Sep 20", distance: "120 km", visibility: "public" },
    ],
  },
  {
    id: "5",
    name: "Rohan Das",
    handle: "@rohan_nearme",
    city: "Bangalore",
    category: "Near me",
    avatarTint: "teal",
    bikes: ["RE Interceptor 650"],
    totalRides: 35,
    attendanceRate: 88,
    ridesOrganised: 0,
    organiserAvgAttendance: 0,
    organiserAvgFillRate: 0,
    kmRidden: 6300,
    connections: 402,
    clubs: 2,
    connected: false,
    ridingInterests: ["Long distance touring"],
    rides: [
      { id: "r6", title: "Chikmagalur Endurance Ride", date: "Sat, Sep 27", distance: "320 km", visibility: "public" },
    ],
  },
  {
    id: "6",
    name: "Vikram Shetty",
    handle: "@vikram_rides",
    city: "Bangalore",
    category: "Near me",
    avatarTint: "blue",
    bikes: ["Yamaha MT-15"],
    totalRides: 8,
    attendanceRate: 65,
    ridesOrganised: 0,
    organiserAvgAttendance: 0,
    organiserAvgFillRate: 0,
    kmRidden: 1450,
    connections: 64,
    clubs: 0,
    connected: false,
    ridingInterests: ["Weekend rides"],
    rides: [],
  },
  {
    id: "7",
    name: "Meera Rao",
    handle: "@meera_onroad",
    city: "Bangalore",
    category: "Near me",
    avatarTint: "purple",
    bikes: ["Honda CB350"],
    totalRides: 2,
    attendanceRate: 100,
    ridesOrganised: 0,
    organiserAvgAttendance: 0,
    organiserAvgFillRate: 0,
    kmRidden: 280,
    connections: 21,
    clubs: 0,
    connected: false,
    ridingInterests: ["Weekend rides"],
    rides: [],
  },
];

interface RidersDirectoryContextValue {
  riders: Rider[];
  toggleConnect: (id: string) => void;
  recordRideAttendance: (joinedNames: string[], attendedNames: string[]) => void;
}

const RidersDirectoryContext = createContext<RidersDirectoryContextValue | undefined>(undefined);

export const RidersDirectoryProvider = ({ children }: { children: ReactNode }) => {
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);

  const toggleConnect = (id: string) => {
    setRiders((prev) =>
      prev.map((rider) => (rider.id === id ? { ...rider, connected: !rider.connected } : rider))
    );
  };

  const recordRideAttendance = (joinedNames: string[], attendedNames: string[]) => {
    const attendedSet = new Set(attendedNames);
    setRiders((prev) =>
      prev.map((rider) => {
        if (!joinedNames.includes(rider.name)) return rider;
        const previousAttended = Math.round((rider.attendanceRate / 100) * rider.totalRides);
        const nextTotalRides = rider.totalRides + 1;
        const nextAttended = previousAttended + (attendedSet.has(rider.name) ? 1 : 0);
        const nextAttendanceRate = Math.round((nextAttended / nextTotalRides) * 100);
        return { ...rider, totalRides: nextTotalRides, attendanceRate: nextAttendanceRate };
      })
    );
  };

  return (
    <RidersDirectoryContext.Provider value={{ riders, toggleConnect, recordRideAttendance }}>
      {children}
    </RidersDirectoryContext.Provider>
  );
};

export const useRidersDirectory = () => {
  const ctx = useContext(RidersDirectoryContext);
  if (!ctx) throw new Error("useRidersDirectory must be used within a RidersDirectoryProvider");
  return ctx;
};
