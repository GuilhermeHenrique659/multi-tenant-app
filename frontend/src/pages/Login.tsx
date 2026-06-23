import { useRef, type SubmitEvent } from "react";
import { email } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { Create, Update } from "../model/User";

export default function Login() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const user = Create(Object.fromEntries(formData.entries()));

    const response = await fetch("api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: user.props.email }),
    })
      .then((res) => res.json())
      .then((data) => data as Record<string, unknown>)
      .catch((err) => {
        console.error(err);
        return null;
      });

    if (!response) return;

    const userUpdated = Update({
      id: response.userId as string,
      name: response.name as string,
      email: user.props.email,
    });

    localStorage.setItem("user", JSON.stringify(userUpdated));

    navigate("/");
  };

  return (
    <div>
      <form onSubmit={onSubmit} ref={formRef}>
        <h1>Login</h1>
        <input type="email" name="email" id="email" />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
