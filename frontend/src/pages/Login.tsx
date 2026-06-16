import { useRef, type SubmitEvent } from "react";
import { User } from "../model/User";
import { email } from "zod";
import { Navigate, useNavigate } from "react-router-dom";

export default function Login() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const user = User.create(Object.fromEntries(formData.entries()));
    console.log(JSON.stringify(user.props));

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

    user.performLogin({
      id: response.userId as string,
      name: response.name as string,
      email: user.props.email,
    });

    localStorage.setItem("user", JSON.stringify(user.props));

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
