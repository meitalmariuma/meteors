import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./HomePage.css";
import { InputNumber, Select, Table } from "antd";
import { MeteorType, YearType } from "../../types";
import Swal from "sweetalert2";

function HomePage() {
  const [years, setYears] = useState<YearType[]>([]);
  const [massInput, setMassInput] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [meteors, setMeteors] = useState<Array<MeteorType>>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchMeteorsData = useCallback(
    async (year: number | null = null) => {
      const offset = meteors.length;

      setLoading(true);

      try {
        const endpoint = year
          ? `http://localhost/api/v1/meteor/${year}`
          : `http://localhost/api/v1/meteor?offset=${offset}`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: { "Content-type": "application/json" },
        });

        const data = await response.json();

        if (!year) {
          setMeteors((prevMeteors) => [...prevMeteors, ...data]);
          setHasMore(data.length > 0);
        } else {
          setMeteors(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [meteors]
  );

  useEffect(() => {
    (async () => {
      const response = await fetch("http://localhost/api/v1/meteor/years", {
        method: "GET",
        headers: { "Content-type": "application/json" },
      });
      const yearsData = await response.json();

      const yearsOptions = yearsData.map(
        (yearResult: { year: number; max: number }) => ({
          label: yearResult.year,
          value: yearResult.year,
          maxMass: yearResult.max,
        })
      );

      setYears(yearsOptions);
    })();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !selectedYear) {
        fetchMeteorsData(null);
      }
    });

    const sentinel = document.getElementById("sentinel");
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [selectedYear, hasMore, fetchMeteorsData]);

  useEffect(() => {
    if (selectedYear) {
      fetchMeteorsData(selectedYear);
    }
  }, [selectedYear]);

  const filteredMeteors = useMemo(() => {
    if (!meteors) return [];

    if (!massInput || !selectedYear) return meteors;

    const filteredMeteors = meteors.filter((meteor) => meteor.mass > massInput);

    if (!filteredMeteors.length && years.length > 0 && massInput) {
      const newYear = years.find(
        (yearObject) => yearObject.maxMass > massInput
      )?.value;
      if (newYear) {
        Swal.fire({
          title:
            "There were no meteors greater than your chosen mass found in your selected year",
          text: `Showing you meteors from the year ${newYear} which is the first year where there is a meteor greater than your filtered mass. The year selection dropdown list now contains only years where there exists a meteor with a mass greater than your selected filter :)`,
          icon: "info",
        });
        setSelectedYear(newYear);
      } else {
        Swal.fire({
          title:
            "There were no meteors found with mass greater than " + massInput,
          icon: "info",
        });
      }
    }

    return filteredMeteors;
  }, [meteors, selectedYear, massInput, years]);

  const filteredYears = useMemo(() => {
    return massInput
      ? years.filter((yearObject) => yearObject.maxMass > massInput)
      : years;
  }, [massInput, years]);

  const tableColumns = useMemo(
    () => [
      {
        title: "Year",
        dataIndex: "year",
        key: "year",
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name: string, row: MeteorType) => (
          <span>
            {name} (Id: {row.id})
          </span>
        ),
      },
      {
        title: "Mass",
        dataIndex: "mass",
        key: "mass",
      },
      {
        title: "Classification",
        dataIndex: "recclass",
        key: "recclass",
      },
      {
        title: "Latitude",
        dataIndex: "reclat",
        key: "reclat",
      },
      {
        title: "Longitude",
        dataIndex: "reclong",
        key: "reclong",
      },
    ],
    [meteors]
  );

  return (
    <div className="home-page-container">
      <h1 className="home-page-title">
        Search the NASA meteor landing dataset!
      </h1>
      <Select
        options={filteredYears}
        showSearch
        placeholder="Select a meteor fall year if desired..."
        value={selectedYear}
        onSelect={(value) => setSelectedYear(value as number)}
      />
      <InputNumber
        placeholder="Filter by meteor mass greater than the inputed value..."
        onChange={(value) => setMassInput(value as number)}
        style={{ width: "40%" }}
      />
      <Table
        pagination={selectedYear ? { pageSize: 50 } : false}
        dataSource={filteredMeteors}
        columns={tableColumns}
        style={{ width: "80%" }}
      />
      {!selectedYear && <div style={{ height: "50px" }} id="sentinel"></div>}
      {loading && <p>Loading more data ... :)</p>}
    </div>
  );
}

export default HomePage;
