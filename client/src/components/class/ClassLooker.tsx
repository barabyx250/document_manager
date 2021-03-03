import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import {
	Button,
	Form,
	InputNumber,
	message,
	Radio,
	Row,
	Spin,
	Table,
	Typography,
} from "antd";
import { ColumnsType } from "antd/lib/table/interface";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { ConnectionManager } from "../../managers/connetion/connectionManager";
import { ClassEvent } from "../../types/classEvent";
import { Group } from "../../types/group";
import {
	GroupUserPresence,
	UserPresenceType,
} from "../../types/groupUserPresence";
import { RequestCode, RequestMessage, RequestType } from "../../types/requests";
import { Subject } from "../../types/subject";
import Checkbox from "antd/lib/checkbox/Checkbox";
import { IsHasDeactivateGroupUserMark } from "../../helpers/GroupHelper";
import { GroupUser } from "../../types/groupUser";
import { ObjectStatus } from "../../types/constants";

interface EditableCellProps {
	onChange: (newValue: any) => void;
	value: any;
}

const EditableCell: React.FC<EditableCellProps> = (
	props: EditableCellProps
) => {
	const [counter, setCounter] = useState<number>(props.value);

	const onValuesChange = (value: React.ReactText) => {
		if (value !== undefined && value !== null && value.toString() !== "") {
			console.log("value", value);
			const intValue = parseInt(value.toString());
			if (intValue <= 5 && intValue >= 0) {
				props.onChange(intValue);
				setCounter(intValue);
			}
		}
		if (!value || (value && value.toString().trim() === "")) {
			props.onChange(0);
			setCounter(0);
		}
	};

	return (
		<div>
			<InputNumber
				min={0}
				max={5}
				bordered={false}
				onChange={onValuesChange}
				value={counter}
				style={{ width: "100%" }}
				size="small"
			></InputNumber>
		</div>
	);
};
interface ClassLookerProps {
	class: ClassEvent;
}

interface ClassLookerTableData {
	key: number;
	fullname: string;
	current_mark: number;
	topic_mark: number;
	occupation_mark: number;
	classEvent: ClassEvent;
	presenceData: GroupUserPresence;
	groupUser: GroupUser;
}

export const ClassLooker: React.FC<ClassLookerProps> = (
	props: ClassLookerProps
) => {
	const history = useHistory();
	const [group, setGroup] = useState<Group | undefined>(undefined);
	const [subject, setSubject] = useState<Subject | undefined>(undefined);
	const [rerender, setRerender] = useState<boolean>(false);

	useEffect(() => {
		ConnectionManager.getInstance().registerResponseOnceHandler(
			RequestType.GET_GROUP_BY_ID,
			(data) => {
				const dataMessage = data as RequestMessage<Group[]>;
				if (
					dataMessage.requestCode === RequestCode.RES_CODE_INTERNAL_ERROR &&
					dataMessage.data.length < 1
				) {
					console.log(`Error: ${dataMessage.requestCode}`);
					return;
				}
				console.log("receive", dataMessage.data);
				setGroup(dataMessage.data[0]);
			}
		);
		ConnectionManager.getInstance().registerResponseOnceHandler(
			RequestType.GET_SUBJECT_BY_ID,
			(data) => {
				const dataMessage = data as RequestMessage<Subject[]>;
				if (
					dataMessage.requestCode === RequestCode.RES_CODE_INTERNAL_ERROR ||
					dataMessage.data.length < 1
				) {
					console.log(`Error: ${dataMessage.requestCode}`);
					return;
				}
				console.log("receive", dataMessage.data);
				setSubject(dataMessage.data[0]);
			}
		);
		ConnectionManager.getInstance().emit(RequestType.GET_GROUP_BY_ID, [
			props.class.groupId,
		]);

		ConnectionManager.getInstance().emit(RequestType.GET_SUBJECT_BY_ID, [
			props.class.selectPath.subject,
		]);
	}, []);

	const columns: ColumnsType<any> = [
		{
			title: "ПІБ",
			dataIndex: "fullname",
			key: "fullname",
			sorter: (a: ClassLookerTableData, b: ClassLookerTableData) =>
				a.fullname.localeCompare(b.fullname),
			defaultSortOrder: "ascend",
		},
		{
			title: "Поточна оцінка",
			dataIndex: "current_mark",
			key: "current_mark",
			render: (value, record: ClassLookerTableData) => {
				if (record.groupUser.status === ObjectStatus.NOT_ACTIVE) {
					return record.presenceData.mark.current;
				}

				return (
					<EditableCell
						onChange={(value: any) => {
							record.presenceData.mark.current = value;
						}}
						value={record.presenceData.mark.current}
					></EditableCell>
				);
			},
		},
		{
			title: "Оцінка за тему",
			dataIndex: "topic_mark",
			key: "topic_mark",
			render: (value, record: ClassLookerTableData) => {
				if (record.groupUser.status === ObjectStatus.NOT_ACTIVE) {
					return record.presenceData.mark.topic;
				}

				return (
					<EditableCell
						onChange={(value: any) => {
							record.presenceData.mark.topic = value;
						}}
						value={record.presenceData.mark.topic}
					></EditableCell>
				);
			},
		},
		{
			title: "Підсумкова оцінка за предмет навчання",
			dataIndex: "occupation_mark",
			key: "occupation_mark",
			render: (value, record: ClassLookerTableData) => {
				if (record.groupUser.status === ObjectStatus.NOT_ACTIVE) {
					return record.presenceData.mark.subject;
				}

				return (
					<EditableCell
						onChange={(value: any) => {
							record.presenceData.mark.subject = value;
						}}
						value={record.presenceData.mark.subject}
					></EditableCell>
				);
			},
		},
		{
			title: "Наряд",
			dataIndex: "outfit",
			key: "outfit",
			render: (value, record: ClassLookerTableData) => {
				return (
					<Checkbox
						checked={record.presenceData.type === UserPresenceType.OUTFIT}
						onClick={() => {
							if (record.presenceData.type === UserPresenceType.OUTFIT) {
								record.presenceData.type = UserPresenceType.PRESENCE;
							} else {
								record.presenceData.type = UserPresenceType.OUTFIT;
							}
							setRerender(!rerender);
						}}
						disabled={record.groupUser.status === ObjectStatus.NOT_ACTIVE}
					></Checkbox>
				);
			},
		},
		{
			title: "Відпустка",
			dataIndex: "vacation",
			key: "vacation",
			render: (value, record) => {
				return (
					<Checkbox
						checked={record.presenceData.type === UserPresenceType.VACATION}
						onClick={() => {
							if (record.presenceData.type === UserPresenceType.VACATION) {
								record.presenceData.type = UserPresenceType.PRESENCE;
							} else {
								record.presenceData.type = UserPresenceType.VACATION;
							}
							setRerender(!rerender);
						}}
						disabled={record.groupUser.status === ObjectStatus.NOT_ACTIVE}
					></Checkbox>
				);
			},
		},
		{
			title: "Відрядження",
			dataIndex: "bussiness_trip",
			key: "bussiness_trip",
			render: (value, record) => {
				return (
					<Checkbox
						checked={
							record.presenceData.type === UserPresenceType.BUSSINESS_TRIP
						}
						onClick={() => {
							if (
								record.presenceData.type === UserPresenceType.BUSSINESS_TRIP
							) {
								record.presenceData.type = UserPresenceType.PRESENCE;
							} else {
								record.presenceData.type = UserPresenceType.BUSSINESS_TRIP;
							}
							setRerender(!rerender);
						}}
						disabled={record.groupUser.status === ObjectStatus.NOT_ACTIVE}
					></Checkbox>
				);
			},
		},
		{
			title: "Хворий",
			dataIndex: "sick",
			key: "sick",
			render: (value, record) => {
				return (
					<Checkbox
						checked={record.presenceData.type === UserPresenceType.SICK}
						onClick={() => {
							if (record.presenceData.type === UserPresenceType.SICK) {
								record.presenceData.type = UserPresenceType.PRESENCE;
							} else {
								record.presenceData.type = UserPresenceType.SICK;
							}
							setRerender(!rerender);
						}}
						disabled={record.groupUser.status === ObjectStatus.NOT_ACTIVE}
					></Checkbox>
				);
			},
		},
		{
			title: "Вихідний",
			dataIndex: "free",
			key: "free",
			render: (value, record) => {
				return (
					<Checkbox
						checked={record.presenceData.type === UserPresenceType.FREE}
						onClick={() => {
							if (record.presenceData.type === UserPresenceType.FREE) {
								record.presenceData.type = UserPresenceType.PRESENCE;
							} else {
								record.presenceData.type = UserPresenceType.FREE;
							}
							setRerender(!rerender);
						}}
						disabled={record.groupUser.status === ObjectStatus.NOT_ACTIVE}
					></Checkbox>
				);
			},
		},
	];

	const findOccupation = () => {
		return subject.programTrainings
			.find((pt) => pt.id === props.class.selectPath.programTraining)
			.topics.find((t) => t.id === props.class.selectPath.topic)
			.occupation.find((oc) => oc.id === props.class.selectPath.occupation);
	};

	const tableTitle = () => {
		return (
			<div>
				<Row>
					<Typography.Text underline strong>
						Заняття
					</Typography.Text>
					<Typography.Text>
						{": "}
						{findOccupation().title}
					</Typography.Text>
				</Row>
				<Row>
					<Typography.Text underline strong>
						{"Дата"}
					</Typography.Text>
					<Typography.Text>
						{": " +
							new Date(props.class.date).toLocaleDateString("uk", {
								year: "numeric",
								month: "2-digit",
								day: "2-digit",
							})}
					</Typography.Text>
				</Row>
				<Row>
					<Typography.Text underline strong>
						{"Місце"}
					</Typography.Text>
					<Typography.Text>
						{": "}
						{props.class.place}
					</Typography.Text>
				</Row>
			</div>
		);
	};

	if (!group || !subject) {
		return <Spin></Spin>;
	}

	const tableData: ClassLookerTableData[] = props.class.presences
		// .filter((pr) => {
		// 	const gu = group.users.find((u) => u.id === pr.userId);

		// 	return IsHasDeactivateGroupUserMark(gu, pr);
		// })
		.map((presence) => {
			const gu = group.users.find((u) => u.id === presence.userId);

			return {
				key: presence.id,
				fullname: gu.fullname,
				current_mark: presence.mark.current,
				topic_mark: presence.mark.topic,
				occupation_mark: presence.mark.subject,
				classEvent: props.class,
				presenceData: presence,
				groupUser: gu,
			};
		});

	const onUpdateClassClick = () => {
		ConnectionManager.getInstance().registerResponseOnceHandler(
			RequestType.UPDATE_CLASS,
			(data) => {
				const dataMessage = data as RequestMessage<ClassEvent>;
				if (dataMessage.requestCode === RequestCode.RES_CODE_INTERNAL_ERROR) {
					console.log(`Error: ${dataMessage.requestCode}`);
					message.success("Сталася помилка! Зверніться до адміністратора!");
					return;
				}

				message.success("Оновлено!");
			}
		);

		ConnectionManager.getInstance().emit(RequestType.UPDATE_CLASS, props.class);
	};

	return (
		<div className="swing-in-top-fwd">
			<Table
				pagination={false}
				bordered
				direction="rtl"
				columns={columns}
				dataSource={tableData}
				title={tableTitle}
				rowClassName={(record: ClassLookerTableData, index) => {
					if (record.groupUser.status === ObjectStatus.NOT_ACTIVE)
						return "row_grou-user_deactivate";

					return "";
				}}
			></Table>
			<Button type="primary" onClick={onUpdateClassClick}>
				Зберегти зміни
			</Button>
		</div>
	);
};
