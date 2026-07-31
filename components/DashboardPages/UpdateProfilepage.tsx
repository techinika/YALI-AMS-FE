"use client";

import {
  useCohortsQuery,
  useCountriesQuery,
  useDistrictsQuery,
  useGenderQuery,
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
  useTracksQuery,
  useWorkingSectorQuery,
} from "@/lib/features/otherSlice";
import {
  useGetOneUserQuery,
  useUpdatedUserMutation,
  useUploadPictureMutation,
} from "@/lib/features/userSlice";
import { useEffect, useState, useCallback } from "react";
import Loading from "@/app/loading";
import { useSearchParams } from "next/navigation";
import { getUser } from "@/helpers/auth";
import { MdCloudUpload, MdClose, MdEdit } from "react-icons/md";
import { Member } from "@/types/user";
import { PageHeader } from "../parts/PageHeader";
import { Save } from "lucide-react";
import { TextAreaField } from "../ui/textarea";
import { Personal } from "../parts/update/UpdateProfilePersonal";
import {
  useGetOrganizationsForUserQuery,
  useOrganizationsQuery,
} from "@/lib/features/orgSlice";
import { ShowOrganizationToUpdate } from "../parts/update/ShowOrganizations";

const getInitialValues = (usr: Member | undefined) => ({
  firstName: usr?.firstName || "",
  middleName: usr?.middleName || "",
  lastName: usr?.lastName || "",
  email: usr?.email || "",
  linkedin: usr?.linkedin || "",
  instagram: usr?.instagram || "",
  twitter: usr?.twitter || "",
  facebook: usr?.facebook || "",
  bio: usr?.bio || "",
  gender: usr?.gender?.id || "",
  phoneNumber: usr?.phoneNumber || "",
  districtName: usr?.residentDistrict?.id || "",
  sectorId: usr?.residentSector?.id || "",
  residentCountryId: usr?.residentCountry?.id || "",
  state: usr?.state?.id || "",
  whatsAppNumber: usr?.whatsappNumber || "",
  nearlestLandmark: usr?.nearestLandmark || "",
  track: usr?.track?.id || "",
  cohortId: usr?.cohort?.id || "",
  profileImageId: usr?.profileImage?.id || "",
});

function UpdateProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const user = getUser();
  const isAdmin = user?.role?.name === "ADMIN";
  const targetId =
    isAdmin && typeof userId === "string" && userId.trim() !== ""
      ? userId
      : user?.id;

  const [activeTab, setActiveTab] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<any>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [country, setCountry] = useState<string>("");
  const [changeEmail, setChangeEmail] = useState(true);
  const [foundedOrganizations, setFoundedOrganizations] = useState<any[]>([]);
  const [employedOrganizations, setEmployedOrganizations] = useState<any[]>([]);

  const [updatedUser] = useUpdatedUserMutation();
  const { data: UserData, refetch } = useGetOneUserQuery<{ data: Member }>(
    targetId,
  );

  useEffect(() => {
    if (targetId !== user?.id) setChangeEmail(false);
  }, [targetId, user]);

  const usr: Member | undefined = UserData;

  const [values, setValues] = useState<any>(getInitialValues(usr));
  const [formErrors, setFormErrors] = useState<any>({});

  const { data: GenderData } = useGenderQuery("");
  const { data: CohortsData } = useCohortsQuery("");
  const { data: CountryData } = useCountriesQuery("");
  const { data: DistrictData } = useDistrictsQuery("");
  const { data: TracksData } = useTracksQuery("");
  const { data: AllOrganizationsData } = useOrganizationsQuery("");
  const { data: WorkingSectorsData } = useWorkingSectorQuery("");
  const { data: userOrganizations, refetch: organizationRefetch } =
    useGetOrganizationsForUserQuery(targetId);
  const { data: SectorsData } = useSectorsByDistrictQuery(selectedDistrict, {
    skip: !selectedDistrict,
  });

  const { data: StatesData } = useStatesByCountryQuery(country, {
    skip: !country,
  });

  const [uploadPicture] = useUploadPictureMutation();

  const genders = GenderData?.data || [];
  const districts = DistrictData?.data || [];
  const countries = CountryData?.data || [];
  const tracks = TracksData?.data || [];
  const cohorts = CohortsData?.data || [];
  const workingSectors = WorkingSectorsData?.data || [];
  const allOrganizations = AllOrganizationsData?.data || [];
  const sectors = SectorsData?.data || [];
  const states = StatesData?.data || [];

  useEffect(() => {
    if (usr) {
      setValues(getInitialValues(usr));
      if (usr?.residentCountry?.id) setCountry(usr.residentCountry.id);
      if (usr?.residentDistrict?.id)
        setSelectedDistrict(usr?.residentDistrict?.id);
      if (usr.profileImage?.id && !imagePreview) {
        setImagePreview(usr.profileImage.link);
        setValues((prev: any) => ({
          ...prev,
          profileImageId: usr.profileImage?.id,
        }));
      }
    }
  }, [usr]);

  useEffect(() => {
    if (userOrganizations?.data?.length) {
      const foundedOrgs = userOrganizations.data.filter(
        (org: any) => org.relation === "founded",
      );
      const employedOrgs = userOrganizations.data.filter(
        (org: any) => org.relation === "employed",
      );
      setFoundedOrganizations(foundedOrgs);
      setEmployedOrganizations(employedOrgs);
    }
  }, [userOrganizations]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setValues((prev: any) => ({ ...prev, [id]: value }));
    setFormErrors((prev: any) => ({ ...prev, [id]: undefined }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    let selectedValue;
    try {
      selectedValue = JSON.parse(value);
    } catch (error) {
      selectedValue = value;
    }

    setValues((prev: any) => ({ ...prev, [id]: selectedValue }));
    setFormErrors((prev: any) => ({ ...prev, [id]: undefined }));

    if (id === "residentCountryId") {
      setValues((prev: any) => ({
        ...prev,
        state: "",
        districtName: "",
        sectorId: "",
      }));
      setCountry(selectedValue.id === "RW" ? "RW" : selectedValue.id);
    } else if (id === "districtName") {
      setValues((prev: any) => ({ ...prev, sectorId: "" }));
    }
  };

  const validateForm = () => {
    const errors: any = {};
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    const phoneRegex = /^[0-9+]+$/;

    if (!values.firstName) errors.firstName = "First name is required";
    if (!values.lastName) errors.lastName = "Last name is required";
    if (!values.email) errors.email = "Email is required";
    if (values.email && !values.email.includes("@"))
      errors.email = "Invalid email address";
    if (!values.residentCountryId)
      errors.residentCountryId = "Resident country is required";
    if (values.linkedin && !urlRegex.test(values.linkedin))
      errors.linkedin = "Invalid LinkedIn URL";
    if (values.twitter && !urlRegex.test(values.twitter))
      errors.twitter = "Invalid X (Twitter) URL";
    if (values.instagram && !urlRegex.test(values.instagram))
      errors.instagram = "Invalid Instagram URL";
    if (values.facebook && !urlRegex.test(values.facebook))
      errors.facebook = "Invalid Facebook URL";
    if (values.phoneNumber && !phoneRegex.test(values.phoneNumber))
      errors.phoneNumber = "Phone number must be digits and '+' only";
    if (values.whatsAppNumber && !phoneRegex.test(values.whatsAppNumber))
      errors.whatsAppNumber = "WhatsApp number must be digits and '+' only";
    if (values.bio && values.bio.length > 500)
      errors.bio = "Bio cannot exceed 500 characters";
    if (values.nearlestLandmark && values.nearlestLandmark.length > 255)
      errors.nearlestLandmark = "Landmark cannot exceed 255 characters";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fix the validation errors before saving.");
      return;
    }

    setIsLoading(true);
    const formValues: any = values;

    try {
      const res = await updatedUser({
        userId: usr?.id,
        user: {
          firstName: formValues.firstName,
          middleName: formValues.middleName,
          lastName: formValues.lastName,
          email: formValues.email,
          linkedin: formValues.linkedin,
          instagram: formValues.instagram,
          twitter: formValues.twitter,
          facebook: formValues.facebook,
          bio: formValues.bio,
          phoneNumber: formValues.phoneNumber,
          whatsappNumber: formValues.whatsAppNumber,
          genderName: formValues.gender,
          nearestLandmark: formValues.nearlestLandmark,
          cohortId: formValues.cohortId,
          trackId: formValues.track,
          residentDistrictId: formValues.districtName,
          residentSectorId: formValues.sectorId,
          residentCountryId: formValues.residentCountryId,
          state: formValues.state,
          profileImageId: formValues.profileImageId,
        },
      }).unwrap();

      if (res.message) {
        setValues(getInitialValues(usr));
        setImagePreview(null);
        setImageData(null);
        setUploadSuccess(false);

        if (formValues.profileImageId) {
          setValues((prev: any) => ({ ...prev, profileImageId: "" }));
        }
        setSuccess("User updated successfully!");
        refetch();
      }
    } catch (apiError: any) {
      console.error(apiError);
      let errorMessage =
        "Updating user Failed! Try again, or contact the administrator!";
      if (apiError?.status === 409) {
        errorMessage = apiError?.data?.error;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageData(file);
      setUploadSuccess(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    if (imageData && usr?.id) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("profileImage", imageData);
        formData.append("userId", usr.id);

        const data = await uploadPicture(formData).unwrap();

        if (data?.image) {
          setSuccess("Image uploaded successfully!");
          setValues((prev: any) => ({
            ...prev,
            profileImageId: data?.image?.id,
          }));
          setUploadSuccess(true);
          refetch();
        }
      } catch (apiError: any) {
        setError(apiError?.error || "Image upload failed.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageData(null);
    setUploadSuccess(false);
    setValues((prev: any) => ({ ...prev, profileImageId: "" }));
  };

  const tabs = [
    {
      label: "Personal & Social",
      content: (
        <Personal
          values={values}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          errors={formErrors}
          sectors={sectors}
          cohorts={cohorts}
          districts={districts}
          genders={genders}
          countries={countries}
          usr={usr as Member}
          setSelectedDistrict={setSelectedDistrict}
          tracks={tracks}
          auth={false}
          states={states}
          setCountry={setCountry}
          changeEmail={changeEmail}
          setChangeEmail={setChangeEmail}
        />
      ),
    },
    {
      label: "Your Initiative (Founded)",
      content: (
        <ShowOrganizationToUpdate
          orgs={foundedOrganizations}
          userId={targetId}
          refetch={organizationRefetch}
          organizations={allOrganizations}
        />
      ),
    },
    {
      label: "Employment History",
      content: (
        <ShowOrganizationToUpdate
          orgs={employedOrganizations}
          userId={targetId}
          refetch={organizationRefetch}
          organizations={allOrganizations}
        />
      ),
    },
  ];

  if (usr === undefined) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <PageHeader
        title="Update Profile"
        description="Make changes to your profile information below and save to update."
        actionTitle="Save Changes"
        Icon={Save}
        onAction={handleSubmit}
        loading={isLoading}
        disabled={false}

      />
      {(error || success) && (
        <div
          className={`px-4 py-3 rounded-xl relative mb-6 shadow-md transition-all duration-300 ${
            error
              ? "bg-red-50 border border-red-400 text-red-700"
              : "bg-green-50 border border-green-400 text-green-700"
          }`}
          role="alert"
        >
          <strong className="font-bold">{error ? "Error!" : "Success!"}</strong>
          <span className="block sm:inline ml-2">{error || success}</span>
        </div>
      )}

      <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8">
        <div className="border-b border-gray-200 pb-6 mb-8 flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col items-center lg:items-start shrink-0 w-full lg:w-1/4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Profile Picture
            </h3>
            <div className="relative w-40 h-40">
              <img
                src={
                  imagePreview ||
                  usr?.profileImage?.link ||
                  "/placeholder-avatar.png"
                }
                alt="Profile Preview"
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow-lg"
              />
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white cursor-pointer hover:bg-primary transition-colors shadow-lg"
                title="Change Profile Picture"
              >
                <MdEdit className="w-5 h-5" />
                <input
                  id="profile-image-upload"
                  type="file"
                  className="hidden"
                  onChange={handlePreview}
                />
              </label>
            </div>

            {imageData && !uploadSuccess && (
              <div className="flex gap-2 items-center mt-4">
                <button
                  onClick={handleFileUpload}
                  className="flex items-center bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-lg transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  <MdCloudUpload className="w-4 h-4 mr-2" />
                  {isLoading ? "Uploading..." : "Upload Image"}
                </button>
              </div>
            )}
            {(imagePreview || usr?.profileImage?.link) && (
              <button
                onClick={handleClearImage}
                className="flex items-center mt-3 text-red-600 hover:text-red-700 text-sm font-medium transition"
              >
                <MdClose className="w-4 h-4 mr-1" />
                Clear Image
              </button>
            )}
          </div>

          <div className="flex-1 lg:w-3/4">
            <TextAreaField
              label="Biography (Max 500 characters)"
              placeholder="Enter a brief biography (e.g., your mission, experience, interests)..."
              value={values.bio}
              onChange={handleChange}
              name="bio"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-base font-medium text-center text-gray-500">
              {tabs.map((tab, index) => (
                <li key={index + 1} className="mr-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabClick(index);
                    }}
                    className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-150 ease-in-out 
                      ${
                        index === activeTab
                          ? "text-primary border-primary font-semibold"
                          : "border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">{tabs[activeTab].content}</div>
        </div>
      </div>
    </div>
  );
}

export default UpdateProfilePage;
