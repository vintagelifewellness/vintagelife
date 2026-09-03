"use client";



import React, { useEffect, useState } from "react";

import axios from "axios";



export default function CnfStock({ dscode }) {



    const [stock, setStock] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");



    const fetchStock = async () => {

        try {

            setLoading(true);

            setError("");



            const response = await axios.get(

                `/api/c&f/get-demands/stockcheck/${dscode}`

            );



            if (response.data.success) {

                setStock(

                    response.data.data?.productDetails || []

                );

            } else {

                setError(

                    response.data.message || "Failed to fetch stock"

                );

            }



        } catch (error) {

            setError(

                error.response?.data?.message ||

                "Failed to fetch C&F stock"

            );

        } finally {

            setLoading(false);

        }

    };



    useEffect(() => {

        if (dscode) {

            fetchStock();

        }

    }, [dscode]);



    if (loading) {

        return (

            <div className="flex justify-center items-center py-10">

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

            </div>

        );

    }



    if (error) {

        return (

            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">

                {error}

            </div>

        );

    }



    return (

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">



            {/* Header */}

            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">

                <div>

                    <h2 className="text-xl font-bold text-gray-800">

                        My Stock

                    </h2>



                    <p className="text-sm text-gray-500 mt-1">

                        Current available C&F stock

                    </p>

                </div>



                <button

                    onClick={fetchStock}

                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"

                >

                    Refresh

                </button>

            </div>



            {/* Empty */}

            {stock.length === 0 ? (

                <div className="py-12 text-center text-gray-500">

                    No stock available

                </div>

            ) : (



                <div className="overflow-x-auto">



                    <table className="w-full">



                        <thead>

                            <tr className="bg-gray-100 text-gray-700 text-sm">

                                <th className="px-6 py-3 text-left">

                                    #

                                </th>



                                <th className="px-6 py-3 text-left">

                                    Product

                                </th>



                                <th className="px-6 py-3 text-center">

                                    Available Quantity

                                </th>



                                <th className="px-6 py-3 text-right">

                                    Single  Price

                                </th>



                                <th className="px-6 py-3 text-right">

                                    RP

                                </th>

                            </tr>

                        </thead>



                        <tbody>



                            {stock.map((item, index) => {



                                const quantity =

                                    Number(item.quantity || 0);



                                return (

                                    <tr

                                        key={index}

                                        className="border-t hover:bg-gray-50"

                                    >



                                        <td className="px-6 py-4 text-gray-500">

                                            {index + 1}

                                        </td>



                                        <td className="px-6 py-4 font-medium text-gray-800">

                                            {item.product}

                                        </td>



                                        <td className="px-6 py-4 text-center">



                                            <span

                                                className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${quantity > 0

                                                        ? "bg-green-100 text-green-700"

                                                        : "bg-red-100 text-red-700"

                                                    }`}

                                            >

                                                {quantity}

                                            </span>



                                        </td>



                                        <td className="px-6 py-4 text-right">

                                            ₹{Number(item.price || 0).toLocaleString("en-IN")}

                                        </td>



                                        <td className="px-6 py-4 text-right">

                                            ₹{Number(item.sp || 0).toLocaleString("en-IN")}

                                        </td>



                                    </tr>

                                );

                            })}



                        </tbody>



                    </table>



                </div>

            )}



        </div>

    );

}