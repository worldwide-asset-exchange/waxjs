type RequiredKeysResponse = string;

export const getProofWaxRequiredKeys = async (
  rpcUrl: string
): Promise<RequiredKeysResponse> => {
  try {
    const response = await fetch(`${rpcUrl}/v1/chain/get_account`, {
      body: JSON.stringify({
        account_name: "proof.wax",
      }),
      method: "POST",
    });

    if (!response.ok) {
      // Handle non-successful HTTP responses (e.g., 404 Not Found, 500 Internal Server Error)
      console.error(`HTTP error! Status: ${response.status}`);
    } else {
      const responseData = await response.json();

      if (responseData.permissions) {
        for (const perm of responseData.permissions) {
          if (perm.perm_name === "active") {
            return perm.required_auth.keys[0].key;
          }
        }
      }
    }
  } catch (error) {
    // Handle any errors that occurred during the fetch or processing
    console.error("An error occurred while fetching Proof Wax keys:", error);
  } finally {
    return ""; // Return an empty string in the finally block
  }
};
