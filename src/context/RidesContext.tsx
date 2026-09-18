import { createContext, useContext, useState, ReactNode } from "react";
import { Comment, Ride } from "@/components/discover/RideCard";

export const INITIAL_RIDES: Ride[] = [
  {
    id: "1",
    title: "Nandi Hills Sunrise Ride",
    type: "club",
    date: "Sat, Sep 20",
    time: "6:30 AM",
    distance: "120 km",
    meetingPoint: "Hebbal Flyover, Bangalore",
    poster: { name: "Royal Riders Bangalore" },
    spotsTaken: 8,
    spotsTotal: 12,
    joined: false,
    viewerIsClubMember: false,
    joinedRiders: [
      "Arjun Mehta",
      "Priya Nair",
      "Karthik Suresh",
      "Sneha Iyer",
      "Rohan Das",
      "Divya Rao",
      "Sanjay Kumar",
      "Meera Pillai",
    ],
  },
  {
    id: "2",
    title: "Mysore Road Twisties",
    type: "open",
    date: "Sun, Sep 21",
    time: "9:00 AM",
    distance: "180 km",
    meetingPoint: "Silk Board Junction, NH275",
    poster: { name: "Arjun Mehta" },
    spotsTaken: 3,
    spotsTotal: 5,
    joined: true,
    joinedRiders: ["Priya Nair", "Karthik Suresh", "Sneha Iyer"],
  },
  {
    id: "3",
    title: "Midnight MG Road Cruise",
    type: "private",
    date: "Fri, Sep 19",
    time: "10:00 PM",
    distance: "40 km",
    meetingPoint: "MG Road Metro Station, Bangalore",
    poster: { name: "Priya Nair" },
    spotsTaken: 0,
    spotsTotal: 0,
    joined: false,
    joinedRiders: [],
  },
  {
    id: "4",
    title: "Chikmagalur Endurance Ride",
    type: "open",
    date: "Sat, Sep 27",
    time: "7:00 AM",
    distance: "320 km",
    meetingPoint: "Nelamangala Toll Plaza, NH48",
    poster: { name: "Karthik Suresh" },
    spotsTaken: 5,
    spotsTotal: 8,
    joined: false,
    joinedRiders: ["Arjun Mehta", "Rohan Das", "Sneha Iyer", "Priya Nair", "Deccan Riders MC"],
  },
  {
    id: "5",
    title: "Off-road Trail Day",
    type: "club",
    date: "Sat, Sep 20",
    time: "6:30 AM",
    distance: "60 km",
    meetingPoint: "Nice Road Toll, Bangalore",
    poster: { name: "Deccan Adventure Collective" },
    spotsTaken: 6,
    spotsTotal: 15,
    joined: false,
    viewerIsClubMember: true,
    joinedRiders: ["Rohan Das", "Vikram Shetty"],
  },
  {
    id: "6",
    title: "Savandurga Dual-Sport Loop",
    type: "club",
    date: "Sun, Aug 31",
    time: "6:00 AM",
    distance: "90 km",
    meetingPoint: "Magadi Road, Bangalore",
    poster: { name: "Deccan Adventure Collective" },
    spotsTaken: 9,
    spotsTotal: 12,
    joined: false,
    joinedRiders: ["Rohan Das", "Vikram Shetty", "Meera Rao"],
    isPast: true,
    attendanceConfirmed: true,
  },
  {
    id: "7",
    title: "Kaiwara Off-road Meet",
    type: "club",
    date: "Sun, Sep 7",
    time: "6:00 AM",
    distance: "140 km",
    meetingPoint: "Hennur Road, Bangalore",
    poster: { name: "Deccan Adventure Collective" },
    spotsTaken: 7,
    spotsTotal: 10,
    joined: false,
    joinedRiders: ["Rohan Das", "Meera Rao"],
    isPast: true,
    attendanceConfirmed: false,
    endedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
  },
  {
    id: "8",
    title: "Skandagiri Night Trail",
    type: "club",
    date: "Sat, Aug 16",
    time: "9:00 PM",
    distance: "70 km",
    meetingPoint: "Hebbal Flyover, Bangalore",
    poster: { name: "Deccan Adventure Collective" },
    spotsTaken: 8,
    spotsTotal: 12,
    joined: false,
    joinedRiders: ["Vikram Shetty"],
    isPast: true,
    attendanceConfirmed: false,
    endedAt: new Date(Date.now() - 200 * 3600 * 1000).toISOString(),
  },
  {
    id: "9",
    title: "Weekend Coffee Run",
    type: "open",
    date: "Sat, Sep 20",
    time: "7:00 AM",
    distance: "60 km",
    meetingPoint: "Indiranagar 100ft Road, Bangalore",
    poster: { name: "Dev Robertson" },
    spotsTaken: 4,
    spotsTotal: 8,
    joined: false,
    joinedRiders: ["Arjun Mehta", "Priya Nair", "Karthik Suresh", "Sneha Iyer"],
    isCancelled: true,
  },
  {
    id: "10",
    title: "Late Night Garage Meetup",
    type: "private",
    date: "Fri, Sep 26",
    time: "9:00 PM",
    distance: "25 km",
    meetingPoint: "Church Street, Bangalore",
    poster: { name: "Dev Robertson" },
    spotsTaken: 1,
    spotsTotal: 4,
    joined: true,
    joinedRiders: ["Vikram Shetty"],
    pendingRequestNames: ["Priya Nair", "Karthik Suresh"],
    comments: [],
    updates: [
      {
        type: "edited",
        reason: "Changed start time from 10pm to 9pm due to weather forecast.",
        authorName: "Dev Robertson",
        timestamp: new Date("2025-09-20T15:45:00").toISOString(),
      },
      {
        type: "edited",
        reason: "Changed the meeting point from MG Road to Koramangala Water Tank. Easier parking.",
        authorName: "Dev Robertson",
        timestamp: new Date("2025-09-19T18:10:00").toISOString(),
      },
    ],
    updateSeenBy: [],
  },
  {
    id: "11",
    title: "Turahalli Forest Trail",
    type: "open",
    date: "Sun, Sep 7",
    time: "6:30 AM",
    distance: "45 km",
    meetingPoint: "Kanakapura Road, Bangalore",
    poster: { name: "Dev Robertson" },
    spotsTaken: 6,
    spotsTotal: 10,
    joined: false,
    joinedRiders: ["Arjun Mehta", "Rohan Das", "Sneha Iyer", "Priya Nair", "Karthik Suresh", "Meera Rao"],
    isPast: true,
    attendanceConfirmed: false,
    endedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
];

interface RidesContextValue {
  rides: Ride[];
  updateRide: (id: string, updater: (ride: Ride) => Ride) => void;
  addRide: (ride: Ride) => void;
  cancelRide: (id: string) => void;
  confirmRideAttendance: (id: string, attendedRiders: string[]) => void;
  approveRideRequest: (rideId: string, riderName: string) => void;
  declineRideRequest: (rideId: string, riderName: string) => void;
  editRideWithReason: (id: string, reason: string, authorName: string) => void;
  cancelRideWithReason: (id: string, reason: string, authorName: string) => void;
  markRideUpdateSeen: (id: string, viewerName: string) => void;
  addRideComment: (id: string, comment: Comment) => void;
}

const RidesContext = createContext<RidesContextValue | undefined>(undefined);

export const RidesProvider = ({ children }: { children: ReactNode }) => {
  const [rides, setRides] = useState<Ride[]>(INITIAL_RIDES);

  const updateRide = (id: string, updater: (ride: Ride) => Ride) => {
    setRides((prev) => prev.map((ride) => (ride.id === id ? updater(ride) : ride)));
  };

  const addRide = (ride: Ride) => {
    setRides((prev) => [ride, ...prev]);
  };

  const cancelRide = (id: string) => {
    setRides((prev) => prev.filter((ride) => ride.id !== id));
  };

  const confirmRideAttendance = (id: string, attendedRiders: string[]) => {
    setRides((prev) =>
      prev.map((ride) => (ride.id === id ? { ...ride, attendanceConfirmed: true, attendedRiders } : ride))
    );
  };

  const approveRideRequest = (rideId: string, riderName: string) => {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === rideId
          ? {
              ...ride,
              pendingRequestNames: (ride.pendingRequestNames ?? []).filter((name) => name !== riderName),
              joinedRiders: [...(ride.joinedRiders ?? []), riderName],
              spotsTaken: ride.spotsTotal > 0 ? ride.spotsTaken + 1 : ride.spotsTaken,
            }
          : ride
      )
    );
  };

  const declineRideRequest = (rideId: string, riderName: string) => {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === rideId
          ? { ...ride, pendingRequestNames: (ride.pendingRequestNames ?? []).filter((name) => name !== riderName) }
          : ride
      )
    );
  };

  const editRideWithReason = (id: string, reason: string, authorName: string) => {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === id
          ? {
              ...ride,
              updates: [
                { type: "edited", reason, authorName, timestamp: new Date().toISOString() },
                ...(ride.updates ?? []),
              ],
              updateSeenBy: [authorName],
            }
          : ride
      )
    );
  };

  const cancelRideWithReason = (id: string, reason: string, authorName: string) => {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === id
          ? {
              ...ride,
              isCancelled: true,
              updates: [
                { type: "cancelled", reason, authorName, timestamp: new Date().toISOString() },
                ...(ride.updates ?? []),
              ],
              updateSeenBy: [authorName],
            }
          : ride
      )
    );
  };

  const markRideUpdateSeen = (id: string, viewerName: string) => {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === id && (ride.updates?.length ?? 0) > 0 && !(ride.updateSeenBy ?? []).includes(viewerName)
          ? { ...ride, updateSeenBy: [...(ride.updateSeenBy ?? []), viewerName] }
          : ride
      )
    );
  };

  const addRideComment = (id: string, comment: Comment) => {
    setRides((prev) =>
      prev.map((ride) => (ride.id === id ? { ...ride, comments: [...(ride.comments ?? []), comment] } : ride))
    );
  };

  return (
    <RidesContext.Provider
      value={{
        rides,
        updateRide,
        addRide,
        cancelRide,
        confirmRideAttendance,
        approveRideRequest,
        declineRideRequest,
        editRideWithReason,
        cancelRideWithReason,
        markRideUpdateSeen,
        addRideComment,
      }}
    >
      {children}
    </RidesContext.Provider>
  );
};

export const useRides = () => {
  const ctx = useContext(RidesContext);
  if (!ctx) throw new Error("useRides must be used within a RidesProvider");
  return ctx;
};
